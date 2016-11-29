var gulp     = require('gulp'),
    del      = require('del'),
    uglify   = require('gulp-uglifyjs'),
    cleancss = require('gulp-clean-css');

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
gulp.task('clean', function() {
    return del.sync(paths.get('build'));
});

gulp.task('build', ['clean'], function() {
    var js = gulp.src(paths.get('scripts') + '*.js')
        .pipe(uglify())
        .pipe(gulp.dest(paths.get('build') + 'scripts/'));
    var css = gulp.src(paths.get('styles') + '*.css')
        .pipe(cleancss())
        .pipe(gulp.dest(paths.get('build') + 'styles/'));
    var html = gulp.src(paths.get('./') + '*.html')
        .pipe(gulp.dest(paths.get('build')));
    var img = gulp.src(paths.get('img') + '**/*')
        .pipe(gulp.dest(paths.get('build') + 'img/'));
});