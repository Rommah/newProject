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

// Сам добавил: pug:
const pug = require('gulp-pug');

// Сам добавил, pug-bem:
const pugbem = require('gulp-pugbem');

//  svg-cпрайты:
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
		'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
		'app/js/app.js' // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
		], {allowEmpty: true})
	.pipe(concat('app.min.js')) // Конкатенируем в один файл
	.pipe(uglify()) // Сжимаем JavaScript
	.pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}
// добавил {allowEmpty: true}, чтобы запускался таск галп с пустым проектом без ошибок
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
		], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
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
	watch('app/**/*.html').on('change', browserSync.reload);
 
	// Мониторим папку-источник изображений и выполняем images(), если есть изменения
	watch(['app/images/src/**/*', '!app/images/src/**/*.svg'],  images);
 
 	// Сам добавил Pug
 	watch(['app/pug/**/*.pug', 'app/pug/template/parts/svg/*.svg'], pugy);

 	// и добавил запуск spriteSvg для создания спрайта при изменении svg файлов
 	watch('app/images/src/*.svg', spriteSvg);
}

// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;
 
// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;
 
// Экспортируем функцию styles() в таск styles
exports.styles = styles;

// Экспорт функции images() в таск images
exports.images = images;

// сам
exports.spriteSvg = spriteSvg;

// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Добавил Сам
exports.pugy = pugy;

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(styles, scripts, browsersync, startwatch);