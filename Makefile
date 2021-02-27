DEFAULT_GOAL: test
FULL: DEFAULT_GOAL doc/index.html

.PHONY: DEFAULT_GOAL clean

all-test: DEFAULT_GOAL test

# Add your formats to the following line:
FORMATS = Standard Sleepmeter SleepAsAndroid PleesTracker
# Low priority formats:
FORMATS += SpreadsheetTable SpreadsheetGraph

DIARY_FILES  = src/DiaryBase.js src/DiaryLoader.js
DIARY_FILES += src/Spreadsheet.js
DIARY_FILES += src/export.js
DIARY_FILES += $(patsubst %,src/%/format.js,$(FORMATS))

CLOSURE_OPTIONS= \
		--generate_exports \
		--export_local_property_definitions \
		--define=COMPILED=true \
		--isolation_mode=IIFE \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--language_in ECMASCRIPT_NEXT_IN \
		--language_out ECMASCRIPT5 \
		--js_output_file $@ \

sleep-diary-formats.js: src/closure-externs.js src/closure.js $(DIARY_FILES)
	@echo "(closure)" $^ -\> $@
	google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--create_source_map $@.map \
		--externs $^
	echo "//# sourceMappingURL="$@.map >> $@

test.js: src/test-harness.js src/test-spreadsheet.js $(patsubst %,src/%/test.js,$(FORMATS))
	cat $^ > $@

doc/index.html: doc/README.md $(DIARY_FILES) doc/tutorials/*.md
	faketime "1970-01-01 00:00:00 +0000" jsdoc -d doc --readme $< $(DIARY_FILES) -u doc/tutorials
	sed -i -e "s/Thu Jan 01 1970 ..:..:.. GMT+0000 (Coordinated Universal Time)/$(shell node -e "console.log(new Date('$(shell git log -1 --format="%ci" doc/README.md $(DIARY_FILES) doc/tutorials )').toString())" )/g" doc/*.html

test: spec/support/jasmine.json test.js sleep-diary-formats.js
	jasmine $<
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-no-sandbox node puppeteer-test.js

clean:
	rm -rf README.html doc/*.html sleep-diary-formats.js* test.js doc/*/README.html doc/*/demo.html doc/fonts doc/scripts doc/styles
