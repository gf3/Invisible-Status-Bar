var ISBInjection = (function() {
	
	// private
	var visibilityChangeTimeout;
	var opacityChangeTimeout;
	var isb; // element
	
	return {
		init: function() {
			// bind "live" events
			var types = ['mouseover', 'mouseout'];
			for (t in types)
				document.body.addEventListener(types[t], function(e) {
					var el = e.target || false;
					while ( el && el.tagName != 'A' ) el = el.parentNode;
					if ( el && el.tagName == 'A' )
						safari.self.tab.dispatchMessage(e.type == 'mouseover' ? 'linkOver' : 'linkOff', {
							href: el.getAttribute('href'),
							target: el.getAttribute('target'),
							clientX: e.clientX,
							clientY: e.clientY,
							altKey: e.altKey,
							ctrlKey: e.ctrlKey,
							metaKey: e.metaKey
						});
				}, true);
				
			// bind message listener
			safari.self.addEventListener("message", function(msg) {
				ISBInjection[msg.name](msg.message);
			}, false);
			
			isb = document.createElement('isb');
			
			// kill webkit transitions if there is flash on the page, and Flash 10.1 is installed
			if (document.querySelectorAll('object').length)
				for (x in navigator.plugins)
					if (navigator.plugins[x].description && navigator.plugins[x].description.indexOf('Flash 10.1') !== -1)
						isb.setAttribute('notransition', true);
			
			// so we don't insert inside iframes or on pages without a body (i.e. frameset, ew)
			if (window !== window.top || !document.getElementsByTagName('body').length ) return;
			
			// use '<isb>' tag to avoid CSS conflicts/overwriting.
			document.getElementsByTagName('body')[0].appendChild(isb);
		},
		hideStatus: function() {
			
			// so we don't show/hide inside iframes or on pages without a body (i.e. frameset, ew)
			if (window !== window.top || !document.getElementsByTagName('body').length ) return;
			
			clearTimeout(opacityChangeTimeout);
			opacityChangeTimeout = setTimeout(function() {
				isb.style.opacity = '0';
				visibilityChangeTimeout = setTimeout(function() {
					clearTimeout(visibilityChangeTimeout);
					isb.style.visibility = 'hidden';
					isb.style.position = 'absolute';
					isb.removeAttribute('visible');
				}, 250);
			}, 50);
		},
		showStatus: function(msg) {
			
			// so we don't show/hide inside iframes or on pages without a body (i.e. frameset, ew)
			if (window !== window.top || !document.getElementsByTagName('body').length ) return;
			
			href = this.mungeHref(msg.href);
			var prefix = href[0];
			var this_href = href[1];
			
			isb.innerHTML = '<isb_span>'+ prefix +'</isb_span>' + decodeURI(this_href);
			
			// if cursor would be in the way on left
			var w = window.getComputedStyle(document.getElementsByTagName('isb')[0]).width.replace(/px|%/, '')*1;
			var h = window.getComputedStyle(document.getElementsByTagName('isb')[0]).height.replace(/px|%/, '')*1;
			var winH = document.documentElement.clientHeight;
			
			isb.setAttribute('side', ( msg.clientX < (w+15) && msg.clientY > (winH - (h+15)) ) ? 'right' : 'left');
			isb.setAttribute('theme', msg.theme);
			
			clearTimeout(opacityChangeTimeout);
			opacityChangeTimeout = setTimeout(function() {
				clearTimeout(visibilityChangeTimeout);
				isb.style.visibility = 'visible';
				isb.style.position = 'fixed';
				isb.style.opacity = '1';
				isb.setAttribute('visible', 'true');
			}, 50);
		},
		mungeHref: function(href) {
			// figure out what to do 
                        var prefix;
			if ( href.match(/^([a-zA-Z]+:)/) )
				prefix = '';
			else if ( href.match(/^\/\//) )
				prefix = location.protocol +'//';
			else if ( href.match(/^\//) )
				prefix = location.protocol +'//'+ location.host;
			else if ( href.match(/^#/) )
				prefix = location.href;
			else
				prefix = location.href.replace(/\/[^\/]*(\?.*)?$/, '/');
				
			// deal with ../ in <a href>
			var this_href = href;
			while ( this_href.match(/\.\.\//) ) {
				this_href = this_href.replace(/\.\.\//, '');
				prefix = prefix.replace(/[^\/]*\/$/, '');
			}
			return [prefix, this_href];
		}
		
		
	};
})();
if ( document.readyState == 'complete' )
	ISBInjection.init();
else window.addEventListener('load', function() {
	ISBInjection.init();
});
