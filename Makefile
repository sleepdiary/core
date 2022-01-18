DEFAULT_GOAL: test
FULL: build test

.PHONY: DEFAULT_GOAL clean build test test-1 test-2 test-3 test-4 test-5

# Add your engines to the following line:
ENGINES = Standard Sleepmeter SleepAsAndroid PleesTracker SleepChart1 ActivityLog Fitbit
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

constants.js: bin/create-constants.sh
	@echo Running create-constants.sh
	@./bin/create-constants.sh

sleepdiary-core.min.js: $(SLEEP_DIARY_ENGINES_EXTERNS) $(DIARY_FILES) constants.js
	@echo Compiling $@
	@npx google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--externs $(SLEEP_DIARY_ENGINES_EXTERNS) \
		--js_output_file $@ \
		--js constants.js $(DIARY_FILES)
	@echo "//# sourceMappingURL="sleepdiary-core.min.js.map >> sleepdiary-core.min.js

test.js: $(SLEEP_DIARY_ENGINES_EXTERNS) $(DIARY_FILES) $(TEST_INPUT) constants.js
	@echo Compiling $@
	@npx google-closure-compiler \
		$(CLOSURE_OPTIONS) \
		--externs $(SLEEP_DIARY_ENGINES_EXTERNS) \
		--js_output_file $@ \
		--js constants.js $(DIARY_FILES) $(TEST_INPUT)
	@echo "//# sourceMappingURL="test.js.map >> test.js

doc/index.html: doc/README.md $(DIARY_FILES) doc/tutorials/*.md
	@echo Running jsdoc -d doc
	@/tmp/libfaketime/src/faketime "1970-01-01 00:00:00 +0000" jsdoc -d doc --readme $< $(DIARY_FILES) -u doc/tutorials
	@echo Fixing timestamps
	@sed -i -e "s/Thu Jan 01 1970 ..:..:.. GMT+0000 (Coordinated Universal Time)/$(shell node -e "console.log(new Date('$(shell git log -1 --format="%ci" doc/README.md $(DIARY_FILES) doc/tutorials )').toString())" )/g" doc/*.html

test: test-1 test-2 test-3 test-4 test-5

# timezone-specific bugs are generally absent here:
test-1: spec/support/jasmine.json sleepdiary-core.min.js test.js
	TZ="Etc/GMT" jasmine $<
	@echo
# UK time GMT half of the year, GMT+1 the rest of the time - catches DST-related bugs:
test-2: spec/support/jasmine.json sleepdiary-core.min.js test.js
	TZ="Europe/London" jasmine $<
	@echo
# Nepal Standard Time is UTC+05:45 - catches bugs that assume a whole-hour offset:
test-3: spec/support/jasmine.json sleepdiary-core.min.js test.js
	TZ="Asia/Kathmandu" jasmine $<
	@echo
# Lowest value in the TZ database:
test-4: spec/support/jasmine.json sleepdiary-core.min.js test.js
	TZ="Pacific/Pago_Pago" jasmine $<
	@echo
# Highest value in the TZ database:
test-5: spec/support/jasmine.json sleepdiary-core.min.js test.js
	TZ="Pacific/Kiritimati" jasmine $<
	@echo

clean:
	rm -rf README.html doc/*.html sleepdiary-core.min.js* test.js* doc/*/README.html doc/fonts doc/scripts doc/styles

build: sleepdiary-core.min.js doc/index.html test.js
	@rm -f constants.js
