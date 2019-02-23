#!/usr/bin/perl -w

use strict;
use File::Basename;
use File::Copy qw(copy);
## Will need to install with cpan / cpanm
use DBI;
use DBD::SQLite;
use JSON;


## Stylish SQLite metadata columns:
my @metaCols = qw(enabled applyBackgroundUpdates url updateUrl md5Url
                  originalCode idUrl originalMd5);


my $test = 1; # Testmode prevents alteration of sources

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
    ## Relative file paths where styles might reside
    Stylish => "stylish.sqlite",
    Stylus  => 'browser-extension-data/{7a7a4a92-a2a0-41d1-9fd7-1e92480d612d}/storage.js',
};

## Identify browser sources on this computer
my $srcs = &find_sources();
my %styles; # Will hold aggregate style information
## Parse and aggregate styles and their metadata from each source
foreach my $src (@{$srcs}) {
    &gather_source($src)
}

sub gather_source {
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
            if ($stype eq 'Stylish') {
                &gather_stylish_styles($file, $src);
            }
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

## Nice way to pretty print JSON for inspection:
##  python -m json.tool my_json.json | less -S
##  https://stackoverflow.com/a/1920585

sub gather_stylus_styles {
    my ($path, $src) = @_;
    ## Stylus uses a JSON file. It also appears to have the most
    ## complex 'schema' for representing the user styles, so it will
    ## be used as the template for how we will structure and
    ## manipulate the styles and associated metadata.
    open(JIN, "<$path") || die "Failed to read stylus JSON:\n  $path\n  $!";
    my $jtxt = "";
    while (<JIN>) { $jtxt .= $_; }
    close JIN;
    my $json = decode_json( $jtxt );
    
}

sub gather_stylish_styles {
    my ($path, $src) = @_;
    ## Stylish uses a SQLite database. Primary information is style
    ## name and CSS code Metadata will indicate domains, if code is
    ## active, etc
    my $dbh = &sqlite_dbh( $path );
    my $get = $dbh->prepare
        ("SELECT ".join(', ', 'name', 'code', @metaCols)." FROM styles");
    $get->execute();
    my $rows = $get->fetchall_arrayref();
    my @noChange;
    foreach my $row ( sort { $a->[0] cmp $b->[0] } @{$rows}) {
        my $name = shift @{$row};
        my $rec  = &style_record($name);
        my $val  = {
            src  => $src,
            name => $name,
            css  => shift @{$row},
        }; 
    }
    ## Do I need to do something to close a SQLite handle?
}

sub style_record {
    ## Return the hash structure from %styles, primary keyed to
    ## name. Create record if needed.
    my $name = shift || "";
    return $styles{$name} ||= {
        name => $name,
        vals => [],
    };
}

sub sqlite_dbh {
    my $path = shift;
    my $dbh = DBI->connect("dbi:SQLite:dbname=$path",'','', {
        sqlite_open_flags => $test ? DBD::SQLite::OPEN_READONLY : undef,
        AutoCommit => 1,
        RaiseError => 1,
        PrintError => 0 });
    return $dbh;
}
