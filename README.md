# DEPRECATED

Version 1.x was designed for FMS 17 and has not been updated in four years. There are numerous outdated library dependencies which have known security issues. We will not be updating version 1.x, but we have chosen not to archive it and make it read only, as there are future plans to create a version 2.x for use with FMS 19+.

# FMS ACE

FileMaker Server Admin Console Extension.

FMS ACE (FileMaker Server Admin Console Extension) is a JavaScript application just like the stock FileMaker Server Admin Console. It provides features not included in the stock Admin Console, but supported by the [FileMaker Server 17 Admin API][blog].

This version of FMS ACE provides the following enhancement:

* Display all schedules on the server in a calendar view
* Filter the schedule display by schedule type
* Create "verify database" schedules
* Create "send message" schedules

Take a look at [the roadmap on GitHub][issues], and submit your own feature request if you have additional ideas. FMS ACE is open source, and we'd love your support if you have JavaScript development skills. See [the contributing guidelines on GitHub][contributing] for more details.

[blog]: https://www.soliantconsulting.com/blog/filemaker-17-admin-console
[issues]: https://github.com/soliantconsulting/fms-ace/issues
[contributing]: https://github.com/soliantconsulting/fms-ace/blob/master/CONTRIBUTING.md

## Quick Start Installation

Download [the latest version from here][zip] and copy the contents of the zip archive to the following location:

[zip]: https://github.com/soliantconsulting/fms-ace/raw/master/built-files/fms-ace.zip

### Windows
```
C:\Program Files\FileMaker\FileMaker Server\HTTPServer\conf\fms-ace\
```

### Mac
```
/Library/FileMaker Server/HTTPServer/htdocs/httpsRoot/fms-ace/
```

## That's it!

Now you should be able to access FMS ACE on your FileMaker Server at the `/fms-ace` route on your server. For example: [https://myserver.soliant.cloud/fms-ace][example]

[example]: https://myserver.soliant.cloud/fms-ace

