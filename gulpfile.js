// Определяем переменную "preprocessor"
let preprocessor = 'less'; 

// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Подключаем Browsersync
const browserSync = require('browser-sync').create();

// Подключаем gulp-concat
const concat = require('gulp-concat');

// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

// Подключаем модули gulp-sass и gulp-less
const sass = require('gulp-sass');
const less = require('gulp-less');

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');

// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Подключаем gulp-imagemin для работы с изображениями
const imagemin = require('gulp-imagemin');

// Подключаем модуль gulp-newer
const newer = require('gulp-newer');

// Подключаем модуль del
const del = require('del');

//  добавил: pug:
const pug = require('gulp-pug');

// ещё добавил, pug-bem:
const pugbem = require('gulp-pugbem');

//так же добавил сжатие HTML после билда:
const htmlmin = require('gulp-htmlmin');

// добавил svg-cпрайты:
const svgSprite = require('gulp-svg-sprite');
let config = {
    shape: {
        dimension: {         // Set maximum dimensions
            maxWidth: 500,
            maxHeight: 500
        },
        spacing: {         // Add padding
            padding: 0
        }
    },
    mode: {
        symbol: {
            dest : '.'
        }
    }
};


// Определяем логику работы Browsersync
function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: './app' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true, // Режим работы: true или false
		// index: "*.html" // добавил сам
		directory: true, // показывать список файлов
		// index: "forms.html"
	})
}

function scripts() {
	return src([ // Берём файлы из источников
		// 'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
		'app/js/**/*.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
		'!app/js/app.min.js'
		], {allowEmpty: true})
	.pipe(concat('app.min.js')) // Конкатенируем в один файл
	// .pipe(uglify()) // Сжимаем JavaScript
	.pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}
// добавил {allowEmpty: true}, чтобы запускался таск галп с пустым проектом без ошибок

// функция сжатия скриптов после переноса в dist (добавил после первого билда):
function buildScriptsOptimise() {
	return src('dist/js/**/*.js', {allowEmpty: true} )
	.pipe(uglify() )
	.pipe(dest('dist/js/') )
}

function styles() {
	// return src('app/' + preprocessor + '/*.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
	return src( ['app/' + preprocessor + '/font.' + preprocessor + '', 'app/' + preprocessor + '/global.' + preprocessor + '', 'app/' + preprocessor + '/*.' + preprocessor + ''],  {allowEmpty: true}) 
	.pipe(concat('app/css/glavniy.less'))
	.pipe(less()) // Преобразуем значение переменной "preprocessor" в функцию
	.pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
	.pipe(autoprefixer({ overrideBrowserslist: ['last 2 versions', '>0.2%'], grid: true })) // Создадим префиксы с помощью Autoprefixer
//	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
	.pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
	.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

function buildStylesOpt(){
	return src('dist/css/**/*.css')
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } ))
	.pipe(dest('dist/css/') )
}

// function styles() {
// 	return src('app/' + preprocessor + '/main.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
// 	.pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
// 	.pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
// 	.pipe(autoprefixer({ overrideBrowserslist: ['last 2 versions', '>0.2%'], grid: true })) // Создадим префиксы с помощью Autoprefixer
// 	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
// 	.pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
// 	.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
// }

// Сам добавил Pug

function pugy() {
	return src('app/pug/*.pug')
	.pipe(pug({
		pretty: true,
		//добавил плагин Pug-bem
		plugins: [pugbem]
	}))
	.pipe(dest('app/'))
}
// и спрайты:
function spriteSvg(){
	return src('app/images/src/*.svg', {allowEmpty: true})
        .pipe(svgSprite(config))
        .pipe(dest('app/pug/template/parts/'))
        .pipe(dest('app/images/dest/'));
}

function images() {
	return src(['app/images/src/**/*', '!app/images/src/**/*.svg']) // Берём все изображения из папки источника
	.pipe(newer('app/images/dest/')) // Проверяем, было ли изменено (сжато) изображение ранее
	.pipe(imagemin()) // Сжимаем и оптимизируем изображеня
	.pipe(dest('app/images/dest/')) // Выгружаем оптимизированные изображения в папку назначения
}

function cleanimg() {
	return del('app/images/dest/**/*', { force: true }) // Удаляем всё содержимое папки "app/images/dest/"
}

function buildcopy() {
	return src([ // Выбираем нужные файлы
		'app/css/**/*.min.css',
		'app/js/**/*.min.js',
		'app/images/dest/**/*',
		'app/**/*.html',

		'app/font/**/*', // добавил перенос шрифтов (не было в исходном)
		'app/video/**/*' // И папку с видео! (тоже не было)

		], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}

// Добавил сжатие хтмл в готовом билде:
function buildHtmlOptimisation(){
	return src('dist/**/*.html')
	.pipe(htmlmin({ collapseWhitespace: true }) )
    .pipe(dest('dist'));
}
 
function cleandist() {
	return del('dist/**/*', { force: true }) // Удаляем всё содержимое папки "dist/"
}

function startwatch() {
 
	// Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
	
	// Мониторим файлы препроцессора на изменения
	watch('app/**/' + preprocessor + '/**/*', styles);
 
	// Мониторим файлы HTML на изменения
	// watch('app/**/*.html').on('change', browserSync.reload);
	watch(['app/**/*.html', 'app/font/**/*']).on('change', browserSync.reload);

	// плюс добавил слежение за шрифтами
	// watch('app/font/', browserSync.reload);
 
	// Мониторим папку-источник изображений и выполняем images(), если есть изменения
	watch(['app/images/src/**/*', '!app/images/src/**/*.svg'],  images);
 
 	// добавил Pug
 	watch(['app/pug/**/*.pug', 'app/pug/template/parts/svg/*.svg'], pugy);

 	// и добавил запуск spriteSvg для создания спрайта при изменении svg файлов
 	watch('app/images/src/*.svg', spriteSvg);

}

// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;
 
// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;

// Создал таск по сжатию финальных скриптов:
exports.buildScriptsOptimise = buildScriptsOptimise;
 

// Экспортируем функцию styles() в таск styles
exports.styles = styles;

// Так же добавил сжатие скриптов (после переноса в билд):
exports.buildStylesOpt = buildStylesOpt;

// Так же добавил сжатие html! (после переноса в билд):
exports.buildHtmlOptimisation = buildHtmlOptimisation;


// Экспорт функции images() в таск images
exports.images = images;

// сам
exports.spriteSvg = spriteSvg;

// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Добавил Сам
exports.pugy = pugy;

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy, 
	buildScriptsOptimise, buildStylesOpt, buildHtmlOptimisation); // последние три функции добавил для сжатия документов уже посел переноса в Dist!

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(styles, scripts, browsersync, startwatch);