
0.4.0 / 2010-12-28 
==================

  * Store a _.ndistro_module_version_ file to check currentness of the module [Konstantin Käfer]

0.3.0 / 2010-12-22 
==================

  * Added the ability to alias module symlinks [Chris Gutierrez]
    For example modules such as node-formidable or node-canvas
    can be aliased as 'formidable' and 'canvas' for clean require()s

0.2.0 / 2010-11-11 
==================

  * Added basic addon build support

0.1.2 / 2010-10-29 
==================

  * Added `update` command
  * Better `--help`

0.1.0 / 2010-10-29 
==================

  * Added possibility to manually set architecture [Szabó Antal]
  * Only output "already installed node" when the versions match

0.0.5 / 2010-09-22 
==================

  * When _index.js_ is found link the entire directory

0.0.4 / 2010-08-04
==================

  * Removed bashisms [thanks dvv]
  * Added listing of user distros
  * Added installing of user distros
  * Added support for node "latest"
  * Changed; install script now installs to the CWD
  * Fixed node install, no longer defers
  * Fixed bin/ndistro --version

0.0.3 / 2010-07-28
==================

  * Altering node shebang lines to ./bin/node

0.0.2 / 2010-07-27
==================

  * Added transparent `wget` support


0.0.1 / 2010-07-26
==================

  * Initial release
