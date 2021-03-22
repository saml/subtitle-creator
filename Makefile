.PHONY = lint
lint: index.html script.js style.css
	js-beautify -s 2 -r $?
