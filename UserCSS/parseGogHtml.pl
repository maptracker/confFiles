#!/usr/bin/perl -w

use strict;

my $home = $ENV{HOME};
my $src  = $ARGV[0] || "$home/Downloads/DOM Source of Selection.html";

die "
Expected HTML source file at:
  $src
  ... but did not find it
" unless (-s "$src");

# Shell script with grep logic:
my $sh = "$0";
$sh =~ s/\.pl$/\.sh/;

# Post shell-grepping output file:
my $out = "$src-OUT.html";

# Command line to parse source HTML:
my $cmd = "$sh '$src' > '$out'";
system($cmd);

# Existing stylesheet:
my $css = "$0";
$css =~ s/\/[^\/]+$/\/GOG.user.css/;
# Find already noted products
my %noted;
open(CSS, "<$css") || die "Failed to read source:\n  $src  \n$!";
while (<CSS>) {
    if (/product-tile-id="(\d+)"/) { $noted{$1}++ }
}
close CSS;


die "
Expected HTML source file at:
  $out
  ... but did not find it
" unless (-s "$out");


my %seen;

open(FILE, "<$out") || die "Failed to read source:\n  $src  \n$!";
while (<FILE>) {
    s/[\r\n]+$//;
    if (/^\s*$/) {
        # Blank line
        print "\n";
    } elsif (/^\/\* /) {
        # Comment
        print "$_\n";
    } elsif (/product-tile-id="(\d+)"/) {
        # Product entry
        my $id = $1;
        next if ($seen{$id}++); # Skip if it's a dupe from the bash output
        next if ($noted{$id});  # Skip if it's already in the CSS
        print "$_\n";
    }
    
}
close FILE;
    
