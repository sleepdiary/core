Many sleep diary programs export data using CSV (comma-separated values) files.  See [Wikipedia's CSV page](https://en.wikipedia.org/wiki/Comma-separated_values) for a general discussion of the format.  This page will discuss specific issues faced by programs that encode and decode CSV sleep diaries.

# Character encoding

[UTF-8](https://en.wikipedia.org/wiki/UTF-8) has become the most common way of encoding text in recent decades.  But the CSV format is older than UTF-8, and there is no standard way to indicate the character encoding of a CSV file.  Most sleep diary programs only support UTF-8 text and do not support any kind of marker to indicate the character encoding.  But most users expect CSV files to work in [Excel](https://en.wikipedia.org/wiki/Microsoft_Excel), which requires UTF-8 files to begin with a [byte order mark](https://en.wikipedia.org/wiki/Byte_order_mark).  And very old programs may only support a rare character encoding.

Here are some specific steps you should take to ensure your program handles UTF-8 well:

1. check whether programs you import data from produce a [byte order mark](https://en.wikipedia.org/wiki/Byte_order_mark)
2. check whether programs you export data to require or expect a [byte order mark](https://en.wikipedia.org/wiki/Byte_order_mark)
3. test how programs you interact with deal with documents that only contain [ASCII](https://en.wikipedia.org/wiki/ASCII) characters
4. test how programs you import data from encode a document containing Pi ([π](https://en.wikipedia.org/wiki/Pi_%28letter%29)) and no other non-ASCII characters
  * a program that cannot encode the character does not support [UTF-8](https://en.wikipedia.org/wiki/UTF-8)
  * a program that generates two bytes `0xCF` and `0x80` generates [UTF-8](https://en.wikipedia.org/wiki/UTF-8)
  * a program that generates any other pattern uses a rare character encoding or has a bug
* test how programs you import data from encode a document containing the Euro sign ([€](https://en.wikipedia.org/wiki/Euro_sign)) and no other non-ASCII characters
  * a program that cannot encode the character either only supports ASCII or a rare character encoding
  * a program that generates three bytes `0xE2`, `0x82`, then `0xAC` uses [UTF-8](https://en.wikipedia.org/wiki/UTF-8)
  * a program that generates a single byte `0xAC` uses [Latin-9](https://en.wikipedia.org/wiki/ISO/IEC_8859-15)
  * a program that generates a single byte `0x80` uses [Windows-1252](https://en.wikipedia.org/wiki/Windows-1252)
* test how programs you import data from encode a document containing the pound sign ([£](https://en.wikipedia.org/wiki/Pound_sign)) and no other non-ASCII characters
  * a program that cannot encode the character either only supports ASCII or a rare character encoding
  * a program that generates two bytes `0xC2` and `0xA3` uses [UTF-8](https://en.wikipedia.org/wiki/UTF-8)
  * a program that generates a single byte `0xA3` and can encode the Euro sign ([€](https://en.wikipedia.org/wiki/Euro_sign)) uses either [Latin-9](https://en.wikipedia.org/wiki/ISO/IEC_8859-15) or [Windows-1252](https://en.wikipedia.org/wiki/Windows-1252)
  * a program that generates a single byte `0xA3` but cannot encode the Euro sign ([€](https://en.wikipedia.org/wiki/Euro_sign)) uses [Latin-1](https://en.wikipedia.org/wiki/ISO/IEC_8859-1)
5. check how programs you export data to handle documents in any of the encodings discussed in the previous step

# Text fields

CSV is a loosely-defined format, having existed for over 30 years before [the official specification](https://tools.ietf.org/html/rfc4180) was written.  This mainly shows up in the way special characters are encoded in text fields.  Specifically, developers generally struggle with _how to encode a literal comma_, _how to encode a literal newline_ and _how to encode a literal double quote_.  The specification says to put strings containing special characters between double quotes, to encode commas and newlines literally, and to encode double quotes as a pair of double quotes.  For example:

    "this is a single field containing one comma (,) one newline (
    ) and one double quote ("")"

In practice, programs often handle these cases poorly.  For example, a program might assume that commas and newlines always indicate field and line boundaries, might encode newlines as `\n`, or might encode quotes as `\"`.  Programs that use backslashes to escape characters don't always escape literal backslashes, so `\n` could indicate a newline or a literal backslash followed by a literal `n`.

Here are some specific steps you should take to ensure your program handles text fields well:

1. check how programs you import data from produce an empty text field
2. check how programs you import data from produce a text field that only contains numbers
3. check how programs you import data from produce a text field that only contains letters
4. check how programs you import data from produce a text field that contains a comma, a newline, a quotation mark and a backslash
5. check how programs you export data to handle documents in any of the fields discussed in the previous step

Once you understand the programs you interact with, you will have to decide how much work you want to put into processing difficult cases.  It is usually possible to construct some data that cannot be processed unambigiously, but those are rarely cases that occur in the real world.  The recommended solutions in this project generally try to handle as many realistic cases as possible without making the code difficult to maintain.
