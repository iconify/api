# Icons

This directory contains custom icon sets and icons.

## Icon sets

Icon sets are stored in IconifyJSON format.

You can use Iconify Tools to create icon sets. See [Iconify Tools documentation](https://docs.iconify.design/tools/tools2/).

Each icon set has prefix. For icon set to be imported, filename must match icon set prefix, for example, `line-md.json` for icon set with `line-md` prefix.

Icon sets that have `info` property and are not marked as hidden, appear in icon sets list and search results (unless those features are disabled).
If you want icon set to be hidden, all you have to do is not add `info` property when creating icon set or remove it.

## Icons

TODO

Currently not supported yet. Create icon sets instead.

## Conflicts

If API serves both custom and Iconify icon sets, it is possible to have conflicting names. If 2 icon sets with identical prefix exist in both sources, custom icon set will be used.

To disable Iconify icon sets, set env variable `ICONIFY_SOURCE` to `none`. You can use `.env` file in root directory.
