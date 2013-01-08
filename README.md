foil
====

`foil` is an experiment to add an implicit tagging hierarchy to Stack Exchange sites.

![foil on Super User](https://github.com/oliversalzburg/foil/raw/master/screenshots/screenshot_main.png)

Details
-------

A question that is tagged with `windows-8` *should* also be treated as if it was tagged with `windows`. As **Windows 8** is a specialization of **Windows**. The response to this issue has always been that "windows" is a substring of "windows-8". Thus, the implicit hierarchy is already in place.

However, on Super User we also have tag structures like `mouse` or `keyboard` which could also be tagged `computer-peripherals` additionally. Also, all questions tagged `fedora`, `rhel`, `ubuntu` or `debian` could also be tagged with `linux` (I don't think `linux-fedora`, `linux-rhel`, `linux-ubuntu`, ... would work just as well).

Of course, `foil` is just a client-side approach and can't be a proper solution. A question that is tagged with `windows-7` will also receive a "foil tag" for `windows`. However, the question obviously isn't really tagged with `windows`. If you would perform a search on the site for all questions tagged with `windows`, the question would not be found (or maybe it would because one is a substring of the other, but you get the idea).

Features
--------

### Tag Expansion
![foil on Super User](https://github.com/oliversalzburg/foil/raw/master/screenshots/screenshot_tag_expand.png)

When clicking on a foil tag, this will lead to a search that combines **all** tags that are combined within that foil tag.

### Favorite Tags
![foil on Super User](https://github.com/oliversalzburg/foil/raw/master/screenshots/screenshot_favorites.png)

If `foil` places a foil tag on a question and you have the corresponding tag in your favorite tags, the question will also be marked as accordingly.