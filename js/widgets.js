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

	update: function (data) {
		this._data = data;
		return this.render();
	},

	render: function () {
		throw 'Not implemented';
	}
});

Saillog.Widget.Index = Saillog.Widget.extend({

	render: function () {
		var widget = this;
		var container = this._container.empty();
		var index = this._data;

		$('<h1></h1>')
			.html(index.title)
			.appendTo(container);

		if (index.text) {
			$('<div class="preface"></div>')
				.html(marked(index.text))
				.appendTo(container);
		}

		var list = $('<ul class="selector"></ul>').appendTo(container);
		$.each(index.logs, function (key, log) {
			if (!log.visible && !Saillog.util.isDev()) {
				return;
			}
			var item = $('<li data-id="' + log.id + '">' + log.title + '</li>').appendTo(list);
			if (!log.visible) {
				item.addClass('disabled');
			}
		});

		if (this.isAuthorized) {
			$('<li class="button create"><i class="icon-plus"></i> New story</li>')
				.on('click', function () {
					widget.fire('create-story');
				})
				.prependTo(list);
			$('<li class="button primary"><a href="test/index.html">Mocha tests</a></li>').appendTo(list);
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
		var widget = this;
		var container = this._container.empty();
		var story = this._data;

		var title = $('<h1></h1>').html(story.properties.title).appendTo(container);

		if (this.isAuthorized) {
			$('<span class="edit hidden"><i class="icon-edit-sign"></i></span>')
				.on('click', function () {
					widget.fire('edit-metadata');
				})
				.appendTo(title);
			$('<button class="create"><i class="icon-plus"></i></button>')
				.on('click', function () {
					widget.fire('create-leg');
				})
				.appendTo(title);
		}

		story.each(function (leg) {
			this._renderLeg(leg.properties)
				.attr('id', 'leg-story-' + leg.properties.id)
				.appendTo(container);
		}, this);

		container.on('click mouseover mouseout', '.leg', function (event) {
			var target = $(event.target);
			var type = target.is('.edit') || target.parent().is('.edit') ? 'edit' : event.type;
			if (type === 'edit') {
				if (event.type !== 'click') {
					return;
				}
			}
			widget.fire(type + '-leg', {
				legId: $(this).attr('id').substr(10)
			});
		});
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
		if (leg.title) {
			title.append(leg.title);
		}
		if (this.isAuthorized) {
			if (title.html() === '') {
				title.append('untitled');
			}
			title.append('<span class="edit hidden"><i class="icon-edit-sign"></i></span>');
		}

		if (leg.distance) {
			var tooltip = 'gevaren ';
			if (leg.duration) {
				tooltip += 'in ' + Saillog.util.formatDuration(leg.duration) + ' uur';
			}
			if (leg['avg_sog']) {
				tooltip += ', met een gemiddelde snelheid van ' + leg['avg_sog'] + 'kts';
			}
			title.append('<span class="distance" title="' + tooltip + '">' +
				Saillog.util.formatDistance(leg.distance) + ' NM</span>');
		}

		if (leg.date) {
			var parts = leg.date.split('-');
			var date = parseInt(parts[2], 10) + '-' + parseInt(parts[1], 10);

			element.prepend('<div class="date">' + date + '</div>');
		}

		if (leg.text !== undefined) {
			element.append(marked(leg.text));
		}

		if (leg.color) {
			var rgb = Saillog.util.hexToRgb(leg.color);
			element.css('border-left', '4px solid ' + rgb.toRgba(0.5));
		}

		return element;
	}
});

/**
 * Abastract editor functionality
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
		label = label || name;
		type = type || 'text';

		var input = $('<input type="' + type + '" name="' + name + '" />');

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
			.append('<button class="save">Save</button>')
			.append(' <button class="cancel">Cancel</button>');

		buttons.on('click', 'button', function () {
			var button = $(this);
			if (button.hasClass('save')) {
				widget.fire('save');
			} else if (button.hasClass('cancel')) {
				widget.fire('cancel');
			}
		});
		return buttons;
	}
});

Saillog.Widget.StoryMetadataEditor = Saillog.Widget.Editor.extend({

	render: function () {
		var container = this._container.empty();
		var editor = $('<div id="editor"><h1>Metadata</h1></div>');

		this._input('title', 'Titel').appendTo(editor);
		this._input('showTimeline', 'Timeline visible', 'checkbox').appendTo(editor);
		this._input('showTrack', 'Recorded track visible', 'checkbox').appendTo(editor);

		this._buttons().appendTo(editor);

		editor.appendTo(container);
		return this.load(this._data);
	}
});

// TODO: inline editor in Widget.Story?
Saillog.Widget.LegMetadataEditor = Saillog.Widget.Editor.extend({

	render: function () {
		var container = this._container.empty();

		var editor = $('<div id="editor"><h1>Bewerken</h1></div>').appendTo(container);

		// TODO: choose type of geometry.
		//$('<span class="type"></span>').appendTo(editor);

		this._input('title', 'Titel').appendTo(editor);
		this._input('date', 'Datum', 'date').appendTo(editor);
		this._input('color', 'Color', 'color').appendTo(editor);
		this._initEpicEditor('text', 'Verhaal', editor);

		this._buttons().appendTo(editor);


		return this.load(this._data);
	},

});