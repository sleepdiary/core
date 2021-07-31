DEFAULT_GOAL: test
FULL: build test

.PHONY: DEFAULT_GOAL clean build test

# Add your engines to the following line:
ENGINES = Standard Sleepmeter SleepAsAndroid PleesTracker SleepChart1 ActivityLog
# Low priority engines:
ENGINES += SpreadsheetTable SpreadsheetGraph

DIARY_FILES  = src/DiaryBase.js src/DiaryLoader.js
DIARY_FILES += src/Spreadsheet.js
DIARY_FILES += src/export.js
DIARY_FILES += $(patsubst %,src/%/engine.js,$(ENGINES))

CLOSURE_OPTIONS= \
		--generate_exports \
		--export_local_property_definitions \
		--isolation_mode=IIFE \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--language_in ECMASCRIPT_NEXT_IN \
		--language_out ECMASCRIPT5 \
		--create_source_map "%outname%.map" \

SLEEP_DIARY_ENGINES_EXTERNS=src/closure-externs.js
TEST_INPUT=src/test-harness.js src/test-spreadsheet.js $(patsubst %,src/%/test.js,$(ENGINES))

sleepdiary-core.min.js: $(SLEEP_DIARY_ENGINES_EXTERNS) $(DIARY_FILES)
	./bin/create-constants.sh
	google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--externs $(SLEEP_DIARY_ENGINES_EXTERNS) \
		--js_output_file $@ \
		--js constants.js $(DIARY_FILES)
	rm constants.js
	echo "//# sourceMappingURL="sleepdiary-core.min.js.map >> sleepdiary-core.min.js

test.js: $(SLEEP_DIARY_ENGINES_EXTERNS) $(DIARY_FILES) $(TEST_INPUT)
	./bin/create-constants.sh
	google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--externs $(SLEEP_DIARY_ENGINES_EXTERNS) \
		--js_output_file $@ \
		--js constants.js $(DIARY_FILES) $(TEST_INPUT)
	rm constants.js
	echo "//# sourceMappingURL="test.js.map >> test.js

doc/index.html: doc/README.md $(DIARY_FILES) doc/tutorials/*.md
	/tmp/libfaketime/src/faketime "1970-01-01 00:00:00 +0000" jsdoc -d doc --readme $< $(DIARY_FILES) -u doc/tutorials
	sed -i -e "s/Thu Jan 01 1970 ..:..:.. GMT+0000 (Coordinated Universal Time)/$(shell node -e "console.log(new Date('$(shell git log -1 --format="%ci" doc/README.md $(DIARY_FILES) doc/tutorials )').toString())" )/g" doc/*.html

test: spec/support/jasmine.json sleepdiary-core.min.js test.js
	TZ="Etc/GMT" jasmine $<
	TZ="Europe/London" jasmine $< # UK time GMT half of the year, GMT+1 the rest of the time
	TZ="Asia/Kathmandu" jasmine $< # Nepal Standard Time is UTC+05:45
	TZ="Pacific/Pago_Pago" jasmine $< # Lowest value in the TZ database
	TZ="Pacific/Kiritimati" jasmine $< # Highest value in the TZ database


clean:
	rm -rf README.html doc/*.html sleepdiary-core.min.js* test.js* doc/*/README.html doc/fonts doc/scripts doc/styles

build: sleepdiary-core.min.js doc/index.html test.js
