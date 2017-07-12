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
        warn "Mode set to: $mode\n";
    } elsif ($arg =~ /dump/i) {
        $mode = "Dump";
        warn "Mode set to: $mode\n";
    } elsif ($arg =~ /(run|go)/) {
        $test = 0;
        warn "Enabling DB write\n"
    }
}

my $testText = $test ? 
    "Test mode, no changes to DB" : "RUNNING - DB set to be altered";

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
    open(META, ">$mFile") || die "Failed to write metadata\n  $mFile\n  $!\n  ";
    print META join("\t", "name", @metaCols)."\n";
    my $get = $dbh->prepare
        ("SELECT ".join(', ', 'name', 'code', @metaCols)." FROM styles");
    $get->execute();

    my $rows = $get->fetchall_arrayref();
    foreach my $row (@{$rows}) {
        my $name = shift @{$row};
        my $css  = shift @{$row};
        print META join("\t", $name, map {defined $_ ? $_ : ""} @{$row}) ."\n";
        my $file = "$styDir/$name.css";
        open(OUT, ">$file") || die "Failed to write file\n  $file\n  $!";
        print OUT $css;
        close OUT;
    }
    close META;
    print `ls -lh "$styDir"`;
    print "Metadata: $mFile\n";
}

sub restore {
    my $bkup = "$db-BKUP";
    my $backNum  = 1;
    while (-s "$bkup.$backNum") { $backNum++; }
    copy($db, "$bkup.$backNum");
    warn "\nBackup of database:\n  $bkup.$backNum\n";

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
        $findId->execute($name);
        my ($id) = $findId->fetchrow_array();
        if ($id) {
            ## Style already in DB
            $getCode->execute($id);
            my ($chk) = $getCode->fetchrow_array();
            if ($code ne $chk) {
                print "   Updated: $name\n";
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
            $add->execute(@row) unless ($test);
            print "       New: $name\n";
        }
    }
    if ($#noChange != -1) {
        print "\n The following styles had no change:\n";
        my $l = 0;
        foreach my $name (@noChange) {
            print "  $name";
            $l += 2 + length($name);
            if ($l > 80) {
                $l = 0;
                print "\n";
            }
        }
        print "\n";
    }
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
