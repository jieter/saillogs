// Simple media overlay...
$.fn['mediaModal'] = function (options) {
	options = $.extend({
		selector: '.thumb',
		ytTemplate: '<iframe id="ytplayer" class="modal_content" type="text/html" ' +
			'src="http://www.youtube.com/embed/{id}?autoplay=1" frameborder="0"/>'
	}, options);

	var overlay = $('#modal_overlay');
	var modal = $('<div class="modal"><span class="modal_close">&times;</span></div>');
	modal.appendTo(overlay);

	var load = function (el) {
		var content;
		if (el.data('youtube-url')) {
			var ytId = el.data('youtube-url').substr(-11);

			modal.find('.modal_content').remove();
			var iframe = $(options.ytTemplate.replace('{id}', ytId));
			iframe.css({
				width: modal.innerWidth() + 'px',
				height: modal.innerHeight() + 'px'
			});

			content = iframe.appendTo(modal);
		} else {
			var src = el.attr('src').replace('.thumb', '');

			modal.find('iframe').remove();
			var img = modal.find('img');
			if (img.length !== 1) {
				img = $('<img src="' + src + '" class="modal_content" />').appendTo(modal);
			}
			content = img.attr('src', src);
		}

		// add caption
		if (el.attr('title') && el.attr('title') !== '') {
			var caption = modal.find('.caption');
			if (caption.length !== 1) {
				caption = $('<span class="caption"></span>').prependTo(modal);
			}
			caption.html(el.attr('title'));
		}
		return content;
	};

	var resize = function () {
		var content = modal.find('.modal_content');
		var border = parseInt(modal.css('border-left-width'), 10) * 2;
		modal.css({
			'width': content.width() + border,
			'height': content.height() + border
		});

		modal.css({
			'margin-left': -(modal.outerWidth() / 2) + 'px'
		});
	};
	var closeModal = function () {
		overlay.fadeOut(200, function () {
			overlay.css('display', 'none');
		});
		modal.fadeOut(200, function () {
			modal.find('img, iframe').remove();
		});
		overlay.add(modal).off('click');
	};

	return this.each(function () {
		var container = $(this);

		var jumpFrom = function (el, direction) {
			var thumbs = container.find(options.selector);
			var currentId = thumbs.index(el);
			var other;
			if (direction > 0) { // 39 = Right arrow
				other = thumbs.eq(currentId + 1);
			} else { // 37 = Left arrow
				other = thumbs.eq(currentId - 1)
			}
			if (other && other.length == 1) {
				load(other).on('load', resize);

				return other;
			}
			return el;
		};

		container.on('click', options.selector, function () {
			var el = $(this);
			var content = load(el);

			content.on('load', function () {
				overlay.show();
				modal.show().fadeTo(200, 1, resize);
			});

			// close handler
			overlay.add(modal).on('click', function (event) {
				var target = $(event.target);
				if (target.is('img.modal_content')) {
					var offset = target.offset();
					if (event.clientX - offset.left > target.width() / 2) {
						el = jumpFrom(el, 1);
					} else {
						el = jumpFrom(el, -1);
					}
					event.preventDefault();
					event.stopPropagation();
				} else {
					closeModal();
				}
			});

			// some keyboard controls
			$(window).on('keyup', function (event) {
				if (event.keyCode === 27) { // 27 = Escape
					closeModal();
					$(window).off('keyup');
				} else {
					event.preventDefault();

					if (event.keyCode === 39) { // 39 = Right arrow
						el = jumpFrom(el, 1)
					} else if (event.keyCode === 37) { // 37 = Left arrow
						el = jumpFrom(el, -1)
					}

				}
			});
		});
	});
};
