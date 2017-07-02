#!/usr/bin/perl -w

use strict;
use File::Basename;
use DBI;
use DBD::SQLite;


my $workDir = dirname($0);
my $ffDir   = `\$HOME/confFiles/systemSetup/findFirefoxProfile.sh 1`;
$ffDir      =~ s/[\n\r]+$//;

warn "
Working Directory: $workDir
Firefox Profile: $ffDir
";

my $db = "/home/tilfordc/firefoxProfile/stylish.sqlite";

die "Failed to locate Stylish SQLite database at:\n  $db\n" unless (-s $db);

my $dbh = DBI->connect("dbi:SQLite:dbname=$db",'','', {
    sqlite_open_flags => DBD::SQLite::OPEN_READONLY,
    AutoCommit => 1,
    RaiseError => 1,
    PrintError => 0 });

my $get = $dbh->prepare("SELECT name, code FROM styles");
$get->execute();
my $rows = $get->fetchall_arrayref();
foreach my $row (@{$rows}) {
    my ($name, $css) = @{$row};
    my $file = "$workDir/$name.css";
    open(OUT, ">$file") || die "Failed to write file\n  $file\n  $!";
    print OUT $css;
    close OUT;
}
print `ls -lh "$workDir"`;
