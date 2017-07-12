#!/usr/bin/perl -w

use strict;
use File::Basename;
use DBI;
use DBD::SQLite;


my $workDir = dirname($0);
my $ffDir   = `\$HOME/confFiles/systemSetup/findFirefoxProfile.sh 1`;
$ffDir      =~ s/[\n\r]+$//;
my $db      = "/home/tilfordc/firefoxProfile/stylish.sqlite";

print "
Working Directory: $workDir
  Firefox Profile: $ffDir
         Database: $db
";


die "Failed to locate Stylish SQLite database at:\n  $db\n" unless (-s $db);

my $dbh = DBI->connect("dbi:SQLite:dbname=$db",'','', {
    sqlite_open_flags => DBD::SQLite::OPEN_READONLY,
    AutoCommit => 1,
    RaiseError => 1,
    PrintError => 0 });


# id will be specific to each SQLite instance, do not include
my @metaCols = qw(url updateUrl md5Url enabled originalCode 
                  idUrl applyBackgroundUpdates originalMd5);
my $get = $dbh->prepare("SELECT code, name, ".
                        join(', ', @metaCols)." FROM styles ORDER BY name");
my $xFile = "$workDir/_extracol.tsv";
my $mFile = "$workDir/_metadata.tsv";
open(XFILE, ">$xFile") || die "Failed to write extra col info\n  $xFile\n  $!";
print XFILE join("\t", 'name', @metaCols)."\n";
$get->execute();
my $rows = $get->fetchall_arrayref();
for my $r (0..$#{$rows}) {
    my @line = map { defined $_ ? $_ : '{null}' } @{$rows->[$r]};
    my $code = shift @line;
    my $name = $line[0];
    my $file = "$workDir/$name.css";
    open(OUT, ">$file") || die "Failed to write file\n  $file\n  $!";
    print OUT $code;
    close OUT;
    map { s/\t/    /g } @line;
    print XFILE join("\t", @line)."\n";
    print "\n" unless ($r % 4);
    printf("%5d %-24s", (-s $file), "$name.css");
}
close XFILE;

my $mget = $dbh->prepare("SELECT s.name, m.name, m.value". 
                         "  FROM styles s, style_meta m".
                         " WHERE s.id = m.style_id ORDER BY s.name, m.name");
$mget->execute();
my $mrows = $mget->fetchall_arrayref();
open(MFILE, ">$mFile") || die "Failed to write metadata\n  $mFile\n  $!";
print MFILE join("\t", qw(styleName name value))."\n";
foreach my $row (@{$mrows}) {
    my @line = map { defined $_ ? $_ : '{null}' } @{$row};
    map { s/\t/    /g } @line;
    print MFILE join("\t", @line)."\n";
}

print "\n\nExtraCols: $xFile\n Metadata: $mFile\n\n";
# print `ls -lh "$workDir"`;
