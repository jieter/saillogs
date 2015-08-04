TODO
----


## bugs
 - record global keypresses.
 - Show linestring if created.
 - fix panning to markers.

## Essential
 - make index-generation beter:
  * remove deleted entries.
  * generate all.json with all LineString-features with the right color set.

 - highlight markers (possible switch to something more vectoric)
 - flash messages in UI

 - observable pattern?

 - Fix timezone assumptions. (moment.js?)
 - reorder legs (in time);
  * Update timeline while editing linestrings.
  * in timeline widget
  * show start/end labels on legs.

 - export GPX // KML // PDF
 - clean up stylesheet & check print stylesheet



## Further future

 - make day/night in timeline more fuzzy
 - Geocode start/endpoints

## Maybe?
 - leg story preview in 'real' DOM context
 - markers in timeline?
 - placeholders for total distance per leg // story


## Done.
 - Move back marker to original spot on map after cancelling editing the marker
 - <enter> in title of leg should submit form.
 - <esc> should cancel the form.

 - update color in map after (or during) leg edit.
 - round offsets/widths in timeline control
 - visual representation of legs in time
 - augment properties with some speed/time assumptions
 - resize method for Timeline widget.
 - make legs deletable
 - 'create new' story button + story metadata editor widget
  * make metadata editor

 - 'create new leg' button + logic

 - Make sidebar collapsible
 - sunrise/with https://github.com/mourner/suncalc
 - Make choice between marker/line/no geometry
