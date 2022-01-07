const mix = require('laravel-mix');

mix.js('src/js/app.js', 'js')
	.postCss('src/css/app.css', 'css', [
		require("tailwindcss")
	])
	.setPublicPath('public');

if (mix.inProduction()) {
    mix.version();
}