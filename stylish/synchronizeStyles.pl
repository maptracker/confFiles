#!/usr/bin/perl -w

use strict;
use File::Basename;
use File::Copy qw(copy);
## Will need to install with cpan / cpanm
use DBI;
use DBD::SQLite;

## I maintain a lot of user styles. It is becomming a hassle to
## synchronize these styles across browsers (Firefox, Tor, Waterfox
## and Palemoon), and across Addons (Stylus and Stylish). I anticipate
## using one "legacy" browser (probably Waterfox + Stylish), plus one
## modern browser (Tor + Stylus) *and* maintaining my user scripts as
## individual files in a git repository.

## This script identifies all local style locations, extracts all
## styles, determines (as best as possible) which one is the most
## recent, and then synchronizes that version across all browsers.

my $xpiLocs = {
    Stylish => "stylish.sqlite",
    Stylus  => 'browser-extension-data/{7a7a4a92-a2a0-41d1-9fd7-1e92480d612d}/storage.js',
};

my $srcs = &find_sources();
foreach my $src (@{$srcs}) {
    &explore_source($src)
}

sub explore_source {
    ## Identify style manifest for different addons
    my $src = shift;
    my $dir = $src->{path};
    my $stype = $src->{type};
    if ($stype eq 'CSS Files') {
        warn "[+] Found: $stype:\n    $src->{path}\n";
    } else {
        while (my ($type, $subPath) = each %{$xpiLocs}) {
            my $file = join('/', $dir, $subPath);
            next unless (-s $file);
            warn "[+] Found: $stype + $type:\n    $file\n";
        }
    }
}

sub find_sources {
    ## Identify Firefox user profile folders
    my $HOME = $ENV{HOME};
    my @browsers = ("$HOME/.mozilla/firefox",
                    "$HOME/tor-browser_en-US/profile.default",
                    "$HOME/.moonchild productions/pale moon",
                    "$HOME/.waterfox");
    my @sources;
    foreach my $bdir (@browsers) {
        next unless (-d "$bdir");
        my $type = 
            $bdir =~ /\.mozilla/   ? "Firefox" :
            $bdir =~ /pale moon/   ? "Palemoon" :
            $bdir =~ /waterfox/    ? "Waterfox" :
            $bdir =~ /tor-browser/ ? "Tor" : "Unknown";
        
        my $pFile = "$bdir/profiles.ini";
        my $src = {
            type => $type,
        };
        if (-s $pFile) {
            ## We need to find the profile subfolders
            if (open(PRF, "<$pFile")) {
                while (<PRF>) {
                    s/[\n\r]+$//;
                    if (/^Path=(.+)$/) {
                        my $path = $1;
                        ## Too lazy to parse IsRelative
                        $path = "$bdir/$path" unless ($path =~ /\//);
                        $src->{path} = $path;
                    }
                }
                close PRF;
            } else {
                warn "[?] Failed to read profile: $pFile\n";
            }
        } else {
            ## This should be the profile itself
            $src->{path} = $bdir;
        }
        if (! -d $src->{path}) {
            warn "[?] Can't find profile: $src->{path}\n";
            next;
        }
        my $pId = $src->{path}; $pId =~ s/.+\///;
        $src->{id} = $pId;
        push @sources, $src;
    }
    ## Finally, add in local style files, if present
    my $ldir = "$HOME/confFiles/stylish/styles";
    push @sources, {
        type => "CSS Files",
        path => $ldir,
    } if ( -d $ldir );
    return \@sources;
}
