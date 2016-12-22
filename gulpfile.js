var gulp     = require('gulp'),
    del      = require('del'),
    uglify   = require('gulp-uglifyjs'),
    cleancss = require('gulp-clean-css'),
    less     = require('gulp-less'),
    imagemin = require('gulp-imagemin'),
    plumber  = require('gulp-plumber'),
    concat   = require('gulp-concat'),
    merge    = require('merge-stream');

var paths = (function() {
    var base = "public/";
    var dirs = {
        styles: 'styles',
        scripts: 'scripts',
        build: 'build',
        img: 'img'
    };

    function getDirPath(tree, dir) {
        for (var i in tree) {
            if (tree.hasOwnProperty(i)) {
                if (typeof tree[i] === 'string' && tree[i] === dir) {
                    return tree[i] + '/';
                } else if (typeof tree[i] === 'object') {
                    if (i === dir) return i + '/';
                    var recursive = getDirPath(tree[i], dir);
                    if (recursive) return i + '/' + recursive;
                }
            }
        }
        return null;
    }

    return {
        get: function(dir) {
            return dir === './' ? base : base + getDirPath(dirs, dir);
        },
        getFolders: function(dir) {
            var base = this.get(dir);
            return fs.readdirSync(base).filter(function(file) {
                return fs.statSync(base + file).isDirectory();
            });
        }
    };
})();

//TASKS
gulp.task('less', function() {
    return gulp.src(paths.get('styles') + '*.less')
        .pipe(plumber(function(error) {
            console.log(error.message);
            this.emit('end');
        }))
        .pipe(less())
        .pipe(gulp.dest(paths.get('styles')));
});

var pages = require('./' + paths.get('scripts') + 'config.json');
gulp.task('js', function() {
    var streams = pages.map(function(page) {
        var deps = page.dependencies.map(function(dep) {
            return paths.get('scripts') + dep;
        });
        return gulp.src(deps)
            .pipe(concat(page.name + '.js'))
            .pipe(gulp.dest(paths.get('scripts')));
    });
    return merge(streams);
});

gulp.task('clean', function() {
    return del.sync(paths.get('build'));
});

gulp.task('build', ['clean', 'less', 'js'], function() {
    var js = gulp.src(paths.get('scripts') + '**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(paths.get('build') + 'scripts/'));
    var css = gulp.src(paths.get('styles') + '*.css')
        .pipe(cleancss())
        .pipe(gulp.dest(paths.get('build') + 'styles/'));
    var img = gulp.src(paths.get('img') + '**/*')
        .pipe(imagemin())
        .pipe(gulp.dest(paths.get('build') + 'img/'));
});

gulp.task('watch', ['less', 'js'], function() {
    gulp.watch(paths.get('styles') + '**/*.less', ['less']);
    gulp.watch(paths.get('scripts') + '**/*.js', ['js']);
});

gulp.task('default', ['watch']);