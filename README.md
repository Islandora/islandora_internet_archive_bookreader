BUILD STATUS
------------
Current build status:
[![Build Status](https://travis-ci.org/Islandora/islandora_internet_archive_bookreader.png?branch=7.x)](https://travis-ci.org/Islandora/islandora_internet_archive_bookreader)

CI Server:
http://jenkins.discoverygarden.ca

ISLANDORA INTERNET ARCHIVE BOOKREADER
==================

CONTENTS OF THIS FILE
---------------------

 * summary
 * requirements
 * installation
 * configuration
 * troubleshooting

SUMMARY
-------

A Islandora wrapper for the Internet Archive BookReader.
The source code license is AGPL v3, as described in the LICENSE file.

This module doesn't do much on its own, its assummed that it will be used in
conjunction with a solution pack, where it will be provided as a viewer.

REQUIREMENTS
------------

Internet Archive BookReader
Djatoka
Solr (Optional)

INSTALLATION
------------

Download the Internet Archive BookReader to sites/all/libraries/bookreader.

Developer documentation:
http://openlibrary.org/dev/docs/bookreader

Hosted source code:
https://github.com/Islandora/internet_archive_bookreader.git

CONFIGURATION
-------------

This module requires that you set up Djatoka, please follow the steps outlined
at the following link.

https://wiki.duraspace.org/display/ISLANDORA6121/Chapter+12+-+Installing+Solution+Pack+Dependencies

Also be sure to visit the configuration page for this module, here you can
modify the default settings and test your connection to Djatoka. Which can be
found at the following link.

http://<yoursite.com>/admin/islandora/internet_archive_bookreader

TROUBLESHOOTING
---------------

Having problems/Solved a problem? Check out the Islandora google groups for a
solution.

Islandora Group:
https://groups.google.com/forum/?hl=en&fromgroups#!forum/islandora

Islandora Dev Group:
https://groups.google.com/forum/?hl=en&fromgroups#!forum/islandora-dev
