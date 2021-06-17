DEFAULT_GOAL: test
FULL: DEFAULT_GOAL doc/index.html

.PHONY: DEFAULT_GOAL clean gh-pages

all-test: DEFAULT_GOAL test

# Add your formats to the following line:
FORMATS = Standard Sleepmeter SleepAsAndroid PleesTracker SleepChart1 ActivityLog
# Low priority formats:
FORMATS += SpreadsheetTable SpreadsheetGraph

DIARY_FILES  = src/DiaryBase.js src/DiaryLoader.js
DIARY_FILES += src/Spreadsheet.js
DIARY_FILES += src/export.js
DIARY_FILES += $(patsubst %,src/%/format.js,$(FORMATS))

CLOSURE_OPTIONS= \
		--generate_exports \
		--export_local_property_definitions \
		--isolation_mode=IIFE \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--language_in ECMASCRIPT_NEXT_IN \
		--language_out ECMASCRIPT5 \
		--create_source_map "%outname%.map" \

SLEEP_DIARY_FORMATS_EXTERNS=src/closure-externs.js
TEST_INPUT=src/test-harness.js src/test-spreadsheet.js $(patsubst %,src/%/test.js,$(FORMATS))

sleep-diary-formats.js: $(SLEEP_DIARY_FORMATS_EXTERNS) $(DIARY_FILES)
	./bin/create-constants.sh
	google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--externs $(SLEEP_DIARY_FORMATS_EXTERNS) \
		--js_output_file $@ \
		--js constants.js $(DIARY_FILES)
	rm constants.js
	echo "//# sourceMappingURL="sleep-diary-formats.js.map >> sleep-diary-formats.js

test.js: $(SLEEP_DIARY_FORMATS_EXTERNS) $(DIARY_FILES) $(TEST_INPUT)
	./bin/create-constants.sh
	google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--externs $(SLEEP_DIARY_FORMATS_EXTERNS) \
		--js_output_file $@ \
		--js constants.js $(DIARY_FILES) $(TEST_INPUT)
	rm constants.js
	echo "//# sourceMappingURL="test.js.map >> test.js

doc/index.html: doc/README.md $(DIARY_FILES) doc/tutorials/*.md
	/tmp/libfaketime/src/faketime "1970-01-01 00:00:00 +0000" jsdoc -d doc --readme $< $(DIARY_FILES) -u doc/tutorials
	sed -i -e "s/Thu Jan 01 1970 ..:..:.. GMT+0000 (Coordinated Universal Time)/$(shell node -e "console.log(new Date('$(shell git log -1 --format="%ci" doc/README.md $(DIARY_FILES) doc/tutorials )').toString())" )/g" doc/*.html

test: spec/support/jasmine.json sleep-diary-formats.js
	jasmine $<
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-no-sandbox node bin/puppeteer-test.js

clean:
	rm -rf README.html doc/*.html sleep-diary-formats.js* test.js* doc/*/README.html doc/fonts doc/scripts doc/styles

gh-pages: sleep-diary-formats.js doc/index.html
