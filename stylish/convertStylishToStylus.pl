#!/usr/bin/perl -w

use strict;
use File::Basename;
use JSON;
use File::Copy qw(copy);

my $workDir = dirname($0);
my $home    = $ENV{HOME};
my $ffDir   = `"$home/confFiles/systemSetup/findFirefoxProfile.sh" 1`;
$ffDir      =~ s/[\n\r]+$//;
$ffDir      = "$home/.mozilla/firefox/$ffDir" unless ($ffDir =~ /^\//);
my $styDir  = "$workDir/styles";
my $mFile   = "$workDir/stylishMetadata.tsv";
my $jFile   = "$workDir/stylusDatabase.json";

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

my $json = "";

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

sub restore {
    ## Convert the set of individual CSS files to the JSON structure
    ## expected by Stylus
    if ($test) {
        $jFile = "/tmp/stylusDatabase.json";
        warn "JSON structure being written to /tmp/\n";
    }
    my %defaults = ( enabled => 1, applyBackgroundUpdates => 1 );
    my %mdata;
    if (-s $mFile) {
        ## Read additional metadata from TSV file (hold-over from
        ## Stylish dumper)
        
        open(META, "<$mFile") ||
            die "Failed to read metadata\n  $mFile\n  $!\n  ";
        my $head = <META>;
        $head =~ s/[\n\r]+$//;
        my @metaCols = split("\t", $head);
        shift @metaCols;
        while (<META>) {
            s/[\n\r]+$//;
            my @row  = split("\t");
            my $name = shift @row;
            $mdata{$name} = {map { $metaCols[$_] => $row[$_] } (0..$#metaCols)};
        }
        close META;
    }

    opendir(my $dh, $styDir) || 
        die "Failed to read style directory:\n  $styDir\n  $!\n  ";
    my @cFiles;
    while (readdir($dh)) {
        my $name;
        push @cFiles, $_ if (/\.css$/);
    }
    closedir($dh);

    my $json = JSON->new->allow_nonref;
    my @fields = qw(name enabled updateUrl md5Url url originalMd5);
    my @jf = map { $json->encode( $_ ) } @fields;

    open(JF, ">$jFile") || die "Failed to write JSON\n  $jFile\n  $!  ";
    print JF "[\n";
    my @noChange;
    @cFiles = sort { lc($a) cmp lc($b) || $a cmp $b } @cFiles;
    for my $ci (0..$#cFiles) {
        my $cf   = $cFiles[$ci];
        my $name = $cf; $name =~ s/\.css$//;
        my $path = "$styDir/$cf";
        open(FILE, $path) || die "Failed to read CSS file:\n  $path\n  $!\n  ";
        my $code = "";
        my @domains;

        while (<FILE>) {
            next if /^\@namespace/;
            my $line = $_;
            if ($line =~ /domain\(/) {
                # Stylish format
                while ($line =~ /(domain\(\s*"\s*([^"]+?)\s*"\s*\))/ ||
                       $line =~ /(domain\(\s*'\s*([^']+?)\s*'\s*\))/) {
                    my ($swp, $dom) = ($1, $2);
                    $line =~ s/\Q$swp\E/ /;
                    push @domains, $dom;
                }
                next;
            }
            $code .= $_ unless ($#domains == -1);
        }
        close FILE;
        my @lines = map { defined $_ ? $_ : ""  } split(/\n/, $code);
        while ($#lines != -1 && $lines[-1] =~ /^\s*$/) { pop @lines; }
        if ($#lines != -1 && $lines[-1] =~ /^\s*\}\s*$/) {
            pop @lines;
        } else {
            warn "Failed to find terminal bracket for $cf";
            next;
        }
        print JF "  {\n";
        my $md = $mdata{$name} || {};
        $md->{name} = $name;
        for my $fi (0..$#fields) {
            my $f = $fields[$fi];
            my $v = $md->{$f} || $defaults{$f};
            if ($f eq 'enabled') {
                $v = $v ? "true" : "false";
            } elsif (!defined $v) {
                $v = "null";
            } else {
                $v = $json->encode($v);
            }
            printf(JF "    %s: %s,\n", $jf[$fi], $v);
        }
        print JF "  }";
        print JF "," unless ($ci == $#cFiles);
        print JF "\n";
    }
    print JF "]\n";
    close JF;
    warn "
Stylus JSON structure generated from CSS files:
  $jFile
";
    
}
