'use strict';

Saillog.Widget = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function (container) {
		this._container = container;
	},

	isAuthorized: Saillog.util.isDev(),

	show: function () {
		this._container.show();
		return this;
	},

	hide: function () {
		this._container.hide();
		return this;
	},

	clear: function () {
		this._container.empty();
		this._container.off();

		return this;
	},

	update: function (data) {
		this._data = data;
		return this.render();
	},

	render: function () {
		throw 'Not implemented';
	},

	icon: function (t) {
		return Saillog.util.icon(t);
	}
});

Saillog.Widget.Index = Saillog.Widget.extend({

	render: function () {
		var widget = this.clear();
		var container = this._container;
		var index = this._data;

		$('<h1></h1>')
			.html(index.title)
			.appendTo(container);

		if (index.text) {
			$('<div class="preface"></div>')
				.html(Saillog.util.renderMarkdown(index.text))
				.appendTo(container);
		}

		var list = $('<ul class="selector"></ul>').appendTo(container);
		$.each(index.logs, function (key, log) {
			if (!log.visible && !Saillog.util.isDev()) {
				return this;
			}
			var item = $('<li data-id="' + key + '">' + log.title + '</li>').appendTo(list);
			if (!log.visible) {
				item.addClass('hidden');
			}

			if (log.distance) {
				item.append('<span class="distance">' + log.distance + 'NM</span>');
			}
		});

		if (this.isAuthorized) {
			$('<li class="button create">' + this.icon('create') + ' New story</li>')
				.on('click', function () {
					widget.fire('create-story');
				})
				.prependTo(list);
			$('<li class="button primary"><a href="test/index.html">Mocha tests</a></li>').appendTo(list);
			$('<li class="button primary"><a href="http://jieter.github.io/saillogs/">@github.io</a></li>').appendTo(list);
			$('<li class="button"><a href="https://github.com/jieter/saillogs/">' + this.icon('github') + ' Repository</a></li>').appendTo(list);
		}

		list.on('click', '[data-id]', function () {
			widget.fire('click-story', {
				id: $(this).data('id')
			});
		});
		return this;
	}
});

Saillog.Widget.Story = Saillog.Widget.extend({

	render: function () {
		var widget = this.clear();
		var container = this._container;
		var story = this._data;

		var title = $('<h1></h1>').html(story.getProperty('title')).appendTo(container);

		if (this.isAuthorized) {
			if (title.html() === '') {
				title
					.addClass('untitled')
					.append('untitled');
			}
			$('<span class="edit hidden">' + this.icon('edit') + '</span>')
				.on('click', function () {
					widget.fire('edit-metadata');
				})
				.appendTo(title);
			$('<button class="create create-leg">' + this.icon('create') + '</i></button>')
				.appendTo(title);
		}

		story.each(function (leg) {
			this._renderLeg(leg)
				.attr('id', 'leg-story-' + leg.id)
				.data('legId', leg.id)
				.appendTo(container);
		}, this);

		if (this.isAuthorized && story.length() > 0) {
			$('<h1></h1>')
				.append('<button class="create create-leg float-right">' + this.icon('create') + '</button>')
				.appendTo(container);
		}

		container.on('click', '.create-leg', function () {
			widget.fire('create-leg');
		});

		container.on('click mouseover mouseout', '.leg', function (event) {
			var target = $(event.target);
			var type = target.is('.edit') || target.parent().is('.edit') ? 'edit' : event.type;

			if (type === 'edit' && event.type !== 'click' || target.hasClass('thumb')) {
				return;
			}
			widget.fire(type + '-leg', {
				legId: $(this).data('legId')
			});
		});
		return this;
	},

	highlight: function (id) {
		var legs = this._container.find('.leg');
		if (!id) {
			legs.removeClass('active');
		}
		var current = legs.filter('#leg-story-' + id);

		if (current.hasClass('active')) {
			return;
		}
		legs.removeClass('active');
		current.addClass('active');
	},

	_renderLeg: function (leg) {
		var element = $('<div class="leg">');

		var title = $('<h3></h3>').appendTo(element);
		title.append(leg.getProperty('title'));

		if (this.isAuthorized) {
			if (title.html() === '') {
				title
					.addClass('untitled')
					.append('untitled');
			}
			title.append('<span class="edit hidden">' + this.icon('edit') + '</span>');
		}

		var distance = leg.getProperty('distance');
		if (distance) {
			var tooltip = 'gevaren ';

			if (leg.getProperty('duration')) {
				tooltip += 'in {duration|duration} uur';
			}
			if (leg.getProperty('avg_sog')) {
				tooltip += ', met een gemiddelde snelheid van {avg_sog}kts';
			}
			title.append(
				leg.template('<span class="distance" title="' + tooltip + '">{distance|distance} NM</span>')
			);
		}

		if (leg.getProperty('date')) {
			element.prepend(leg.template('<div class="date">{date|date}</div>'));
		}

		var text = leg.getProperty('text');
		if (text !== undefined) {
			element.append(Saillog.util.renderMarkdown(text));
		}

		var color = leg.getProperty('color');
		switch (leg.getType()) {
		case 'Point':
			var markerIcon = $($.parseHTML(this.icon('marker') + '&nbsp;'));
			markerIcon.prependTo(title);
			if (color) {
				markerIcon.find('i').css('color', color);
			}
			break;
		case 'LineString':
			if (color) {
				var rgb = Saillog.util.hexToRgb(color);
				element.css('border-left', '4px solid ' + rgb.toRgba(0.5));
			}
			break;
		}

		return element;
	}
});

/**
 * Abstract editor functionality
 */
Saillog.Widget.Editor = Saillog.Widget.extend({

	load: function (data) {
		var input;
		for (var key in data) {
			input = this._container.find('[name=' + key + ']');

			if (!input) {
				continue;
			}
			switch (input.prop('type')) {
			case 'checkbox':
				input.prop('checked', data[key]);
				break;
			default:
				input.val(data[key]);
			}
		}
		if (data.text !== undefined && this._textEditor) {
			this._textEditor.importFile('story-' + data.id, data.text);
		}

		var widget = this;
		this._container.find('input').on('keydown', function (event) {
			switch (event.keyCode) {
			case Saillog.util.keyCodes.escape:
				widget.fire('cancel');
				break;
			case Saillog.util.keyCodes.enter:
				widget.fire('save');
				break;
			}
		});
		return this;
	},

	values: function () {
		var values = {};
		this._container.find('input').each(function () {
			var input = $(this);
			var value;

			switch (input.prop('type')) {
			case 'checkbox':
				value = input.prop('checked');
				break;
			default:
				value = input.val();
			}
			values[input.prop('name')] = value;
		});

		if (this._textEditor) {
			values['text'] = this._textEditor.exportFile();
		}

		return values;
	},

	_input: function (name, label, type) {
		var input;

		label = label || name;

		if (typeof type === 'object') {
			input = $('<select name="' + name + '"></select>');
			for (var key in type) {
				input.append($('<option value="' + key + '">' + type[key] + '</option>'));
			}

			type = 'select';
		} else {
			type = type || 'text';
			input = $('<input type="' + type + '" name="' + name + '" />');
		}
		return $('<div class="group group-' + type + '"></div>').append(
			$('<label for="' + name + '">' + label + '</label>'),
			input
		);
	},

	_initEpicEditor: function (name, label, container) {
		label = label || name;

		var epicContainer = $('<div id="epiceditor" class="epiceditor"></div>');

		$('<div class="group group-epic"></div>').append(
			$('<label for="' + name + '">' + label + '</label>'),
			epicContainer
		).appendTo(container);

		var widget = this;
		var resizeFn = function () {
			epicContainer.width($('#sidebar').width() + 78);
			if (widget._textEditor) {
				widget._textEditor.reflow();
			}
		};

		var resizeInterval = setInterval(resizeFn, 10);
		setTimeout(function () {
			clearInterval(resizeInterval);
		}, 2000);
		$(window).resize(resizeFn);

		this._textEditor = new EpicEditor({
			container: epicContainer[0],
			basePath: 'js/lib/epiceditor',
			button: false
		}).load();
	},

	_buttons: function () {
		var widget = this;
		var buttons = $('<div class="group group-buttons"></div>')
			.append('<button class="save" data-event="save">Save</button>')
			.append(' <button class="cancel" data-event="cancel">Cancel</button>');

		buttons.on('click', 'button', function () {
			var action = $(this).data('event');
			if (action === 'delete' && !confirm('Are you sure?')) {
				return;
			}
			widget.fire(action);
		});
		return buttons;
	}
});

Saillog.Widget.StoryMetadataEditor = Saillog.Widget.Editor.extend({

	render: function () {
		this.clear();
		var container = this._container;
		var editor = $('<div id="editor"><h1>Edit metadata</h1></div>');

		this._input('title', 'Titel').appendTo(editor);
		this._input('showTimeline', 'Show timeline', 'checkbox').appendTo(editor);
		this._input('showCalendar', 'Show calendar', 'checkbox').appendTo(editor);
		this._input('showTrack', 'Show recorded track (track.geojson)', 'checkbox').appendTo(editor);

		this._buttons().appendTo(editor);

		editor.appendTo(container);
		return this.load(this._data);
	}
});

// TODO: inline editor in Widget.Story?
Saillog.Widget.LegMetadataEditor = Saillog.Widget.Editor.extend({

	render: function () {
		this.clear();
		var container = this._container;
		var widget = this;

		var editor = $('<div id="editor"><h1>Edit Leg</h1></div>').appendTo(container);
		this._input('title', 'Titel').appendTo(editor);
		this._input('date', 'Datum', 'date').appendTo(editor);

		// geometry type.
		this._input('type', 'Type', {
			'nothing': 'Just text',
			'marker': 'Place',
			'line': 'Leg'
		})
			.appendTo(editor)
			.find('select').on('change', function () {
				widget.fire('change-type', {
					geometry: $(this).val()
				});
			});

		this._input('color', 'Color', 'color')
			.appendTo(editor)
			.find('input').on('change', function () {
				console.log('color update', $(this).val());
				widget.fire('update-color', {
					color: $(this).val()
				});
			});
		this._initEpicEditor('text', 'Verhaal', editor);

		this._buttons().append(
			'<button data-event="delete" class="delete float-right">Delete</button>'
		).appendTo(editor);


		return this.load(this._data);
	}
});
