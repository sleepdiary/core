DEFAULT_GOAL: test
FULL: DEFAULT_GOAL doc/index.html

.PHONY: DEFAULT_GOAL

all-test: DEFAULT_GOAL test

# Add your formats to the following line:
FORMATS = Standard Sleepmeter SleepAsAndroid PleesTracker

DIARY_FILES = src/DiaryBase.js $(patsubst %,src/%/format.js,$(FORMATS))

CLOSURE=npx google-closure-compiler # run Closure via NPM
#CLOSURE=java -jar compiler.jar # run Closure locally
CLOSURE_OPTIONS= \
		--generate_exports \
		--export_local_property_definitions \
		--define=COMPILED=true \
		--isolation_mode=IIFE \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--language_in ECMASCRIPT_NEXT_IN \
		--js_output_file $@ \

sleep-diary-formats.js: src/closure-externs.js src/closure.js $(DIARY_FILES)
	$(CLOSURE) \
		$(CLOSURE_OPTIONS) \
		--language_out ECMASCRIPT3 \
		--create_source_map $@.map \
		--externs $^
	echo "//# sourceMappingURL="$@.map >> $@

test.js: src/test-harness.js $(patsubst %,src/%/test.js,$(FORMATS))
	cat $^ > $@

doc/index.html: doc/README.md $(DIARY_FILES) doc/tutorials/*.md
	faketime "$(shell git log -1 --format="%ci" doc/README.md $(DIARY_FILES) doc/tutorials )" jsdoc -d doc --readme $< $(DIARY_FILES) -u doc/tutorials

test: spec/support/jasmine.json test.js sleep-diary-formats.js
	npx jasmine $<
