#!/usr/bin/perl -w

use strict;
use File::Basename;
use DBI;
use DBD::SQLite;   ## Will need to install with cpan
use File::Copy qw(copy);

my $workDir = dirname($0);
my $home    = $ENV{HOME};
my $ffDir   = `"$home/confFiles/systemSetup/findFirefoxProfile.sh" 1`;
$ffDir      =~ s/[\n\r]+$//;
$ffDir      = "$home/.mozilla/firefox/$ffDir" unless ($ffDir =~ /^\//);
my $styDir  = "$workDir/styles";
my $mFile   = "$workDir/stylishMetadata.tsv";
unless (-d $styDir) {
    mkdir($styDir) || die "Failed to make style directory\n  $!\n  ";
}

my $mode = "??";
my $test = 1;
foreach my $arg (@ARGV) {
    if (-d $arg && -s "$arg/stylish.sqlite") {
        $ffDir = $arg;
        warn "User-set Firefox directory: $ffDir\n";
    } elsif ($arg =~ /restore/i) {
        $mode = "Restore";
    } elsif ($arg =~ /dump/i) {
        $mode = "Dump";
    } elsif ($arg =~ /(run|go)/) {
        $test = 0;
        warn "Enabling DB write\n"
    }
}

my $chngWhat = $mode eq 'Dump' ? "files" : $mode eq 'Restore' ? "database" : "anything";
my $testText = $test ? "Test mode, no changes to $chngWhat" : 
    "RUNNING - Changes will be made to $chngWhat";

warn "
Working Directory: $workDir
  Firefox Profile: $ffDir
             Mode: $mode
           Safety: $testText

";

my $db = "$ffDir/stylish.sqlite";

die "Failed to locate Stylish SQLite database at:\n  $db\n" unless (-s $db);

my $dbh = DBI->connect("dbi:SQLite:dbname=$db",'','', {
    sqlite_open_flags => $test ? DBD::SQLite::OPEN_READONLY : undef,
    AutoCommit => 1,
    RaiseError => 1,
    PrintError => 0 });

if ($mode eq "Restore") {
    &restore();
} elsif ($mode eq "Dump") {
    &dump();
} else {
    warn "
Nothing done - please run with one of the following arguments:
     dump - Extract all styles from the database
  restore - Import already dumped styles into DB

";
}

sub dump {
    my @metaCols = qw(enabled applyBackgroundUpdates url updateUrl md5Url
                  originalCode idUrl originalMd5);
    if ($test) {
        $mFile = "/tmp/stylishMetadata-TEST.tsv";
        warn "Metadata being written to temp file for test run\n";
    }
    open(META, ">$mFile") || die "Failed to write metadata\n  $mFile\n  $!\n  ";
    print META join("\t", "name", @metaCols)."\n";
    my $get = $dbh->prepare
        ("SELECT ".join(', ', 'name', 'code', @metaCols)." FROM styles");
    $get->execute();

    my $rows = $get->fetchall_arrayref();
    my @noChange;
    foreach my $row ( sort { $a->[0] cmp $b->[0] } @{$rows}) {
        my $name = shift @{$row};
        my $css  = shift @{$row};
        print META join("\t", $name, map {defined $_ ? $_ : ""} @{$row}) ."\n";
        my $file = "$styDir/$name.css";
        my $diff = 0;
        if (-s $file) {
            my @chk = split(/\n/, $css);
            ## Stylish removes terminal blank lines on installation:
            while ($chk[-1] eq '') { pop @chk }
            my $n = 0;
            open(IN, "<$file")  || die "Failed to read file\n  $file\n  $!";
            while (<IN>) {
                s/[\n]$//;
                $diff++ if ($n > $#chk || $chk[$n++] ne $_);
            }
            close IN;
            if ($diff) {
                print "   Changed: $name ($diff lines)\n";
            } else {
                push @noChange, $name;
            }
        } else {
            $diff = 1;
            print "       New: $name\n";
        }
        next if ($test || $diff == 0);
        open(OUT, ">$file") || die "Failed to write file\n  $file\n  $!";
        print OUT $css;
        close OUT;
    }
    close META;
    &report_unchanged( \@noChange );
    # print `ls -lh "$styDir"`;
    print "Metadata: $mFile\n";
}

sub restore {
    my $bkup = "$db-BKUP";
    my $backNum  = 1;
    while (-s "$bkup.$backNum") { $backNum++; }
    unless ($test) {
        copy($db, "$bkup.$backNum");
        warn "\nBackup of database:\n  $bkup.$backNum\n\n";
    }

    open(META, "<$mFile") || die "Failed to read metadata\n  $mFile\n  $!\n  ";
    my $head = <META>;
    $head =~ s/[\n\r]+$//;
    my @metaCols = split("\t", $head);
    shift @metaCols;
    my %mdata;
    while (<META>) {
        s/[\n\r]+$//;
        my @row  = split("\t");
        my $name = shift @row;
        $mdata{$name} = [map { $_ eq "" ? undef : $_ } @row ];
    }
    close META;
    my %defaults = ( enabled => 1, applyBackgroundUpdates => 1 );
    opendir(my $dh, $styDir) || 
        die "Failed to read style directory:\n  $styDir\n  $!\n  ";
    
    my @cols    = ("name", "code", @metaCols);
    my $findId  = $dbh->prepare("SELECT id FROM styles WHERE name = ?");
    my $getCode = $dbh->prepare("SELECT code FROM styles WHERE id = ?");
    my $chkType = $dbh->prepare("SELECT value FROM style_meta ".
                                "WHERE name='type' AND style_id = ?");
    my $setType = $dbh->prepare("INSERT INTO style_meta (style_id,name,value)".
                                " VALUES (?, 'type', 'site')");
    my $chkDom  = $dbh->prepare("SELECT value FROM style_meta ".
                                "WHERE style_id = ? AND name = 'domain'");
    my $delDom  = $dbh->prepare("DELETE FROM style_meta WHERE style_id = ? ".
                                "AND name = 'domain' AND value = ?");
    my $setDom  = $dbh->prepare("INSERT INTO style_meta (style_id,name,value)".
                                " VALUES (?, 'domain', ?)");
    my $setCode = $dbh->prepare("UPDATE styles SET code = ? WHERE id = ?");
    
    my $add     = $dbh->prepare("INSERT INTO styles (".join(', ', @cols).
                                ") VALUES (".join(',', map {'?'} @cols).")");
    my $upd     = $dbh->prepare("UPDATE styles SET ".join(', ', map {
        sprintf("%s = ?", $_) } @cols)." WHERE id = ?");
    my @cFiles;
    while (readdir($dh)) {
        my $name;
        push @cFiles, $_ if (/\.css$/);
    }
    my @noChange;
    foreach my $cf (sort { lc($a) cmp lc($b) || $a cmp $b } @cFiles) {
        my $name = $cf; $name =~ s/\.css$//;
        my $path = "$styDir/$cf";
        my $code = "";
        open(FILE, $path) || die "Failed to read CSS file:\n  $path\n  $!\n  ";
        while (<FILE>) { $code .= $_; }
        close FILE;
        my $chunk = $code; $chunk =~ s/[\n\r]+/ /g;
        my @domains;
        while ($chunk =~ /(domain\(\s*"\s*([^"]+?)\s*"\s*\))/ ||
               $chunk =~ /(domain\(\s*'\s*([^']+?)\s*'\s*\))/) {
            my ($swp, $dom) = ($1, $2);
            $chunk =~ s/\Q$swp\E/ /;
            push @domains, $dom;
        }
        my $dtxt = "(".join(', ', @domains).")";
        $findId->execute($name);
        my ($id) = $findId->fetchrow_array();
        if ($id) {
            ## Style already in DB
            $getCode->execute($id);
            my ($chk) = $getCode->fetchrow_array();
            #if ($name eq 'Ixquick') {warn "$name:\n$chk\n---\n$code\n  ";}
            if ($code ne $chk) {
                print "   Updated: $name $dtxt\n";
                $setCode->execute($code, $id) unless ($test);
            } else {
                push @noChange, $name;
            }
        } else {
            ## New style
            my $mr   = $mdata{$name};
            $mr    ||= [ map { $defaults{$_} || undef } @metaCols ];
            my @row  = ($name, $code, @{$mr});
            $row[$#metaCols + 2] ||= undef; # Pad out default rows
            unless ($test) {
                $add->execute(@row);
                $findId->execute($name);
                ($id) = $findId->fetchrow_array();
            }
            print "       New: $name $dtxt\n";
        }
        if (!$test && $#domains != -1) {
            ## Make sure domains are registered properly in the meta
            ## table

            ## Make sure the 'site' tag is present
            $chkType->execute($id);
            my ($typ) = $chkType->fetchrow_array();
            if (!$typ) {
                # Need to flag the style as associated with a site
                $setType->execute($id);
            } elsif ($typ ne 'site') {
                warn "
!! $name is stored as type '$typ' rather than 'site'
   You may need to manage it manually
";
                next;
            }

            ## Add needed domains, remove those no longer referenced
            ## by style
            my %need = map { $_ => 1 } @domains;
            $chkDom->execute($id);
            my $doms = $chkDom->fetchall_arrayref();

            foreach my $dd (@{$doms}) {
                my $dom = $dd->[0];
                if ($need{$dom}) {
                    ## Already there
                    delete $need{$dom};
                } else {
                    $delDom->execute($id, $dom);
                }
            }
            while (my ($dom, $needed) = each %need) {
                next unless ($needed);
                $setDom->execute($id, $dom);
            }
        }
    }
    &report_unchanged( \@noChange );

    if ($backNum > 10) {
        warn "
There are at least $backNum backup versions of your database.
  You can list them with:
    ls -lhtr '$db-BKUP'*
  You can remove them all with:
    rm '$db-BKUP'*
";
    }
    warn "\n";
    closedir($dh);
}

sub report_unchanged {
    my $noChange = shift;
    return if ($#{$noChange} == -1);
    print "\n The following styles had no change:\n";
    my $l = 0;
    foreach my $name (@{$noChange}) {
        print "  $name";
        $l += 2 + length($name);
        if ($l > 80) {
            $l = 0;
            print "\n";
        }
    }
    print "\n";
}
