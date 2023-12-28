# Dataset
This contains one record for each chapter of the Christian Bible, not including the deuterocanonical books.
### Fields:
1) title: The name of the chapter, e.g. "Genesis 4", "Psalm 1" (note not "Psalms 1"). Feeding this into Bible Gateway search should yield the text of the chapter.
2) abbrev: The short name of the chapter, e.g. "Gen.1". Feeding this into the Bible Gateway audio Bible should yield the audio of the chapter.
3) testament: "Old Testament" for the first 39 books, "New Testament" for the rest.
4) book: The name of the book, e.g. "Genesis", "Psalms" (note not "Psalm").
5) chapter: The chapter number within the book, e.g. for Psalm 2 this will be 2
6) verses: How many verses are in this chapter in the 2011 NIV translation (Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™). Note however that this is just based on the highest verse number that appears in the chapter, so verses which are relegated to a footnote ARE still counted. For example, Mark 7:16 is omitted from the NIV but Mark 7 still counts as having 37 verses.
7) book_index: The number of the book in the traditional Christian ordering, e.g. Genesis is 1, Psalms is 19, Matthew is 40.
8) chapter_index: The number of the chapter since the start of the Bible, e.g. Genesis 1 is 1, Psalm 1 is 479 and Psalm 117 is 595 (the median chapter in this ordering).
9) verse_index: The number of the FINAL verse in that chapter since the start of the Bible, e.g. Genesis 1 is 31 as Genesis 1 has 31 verses, Genesis 2 is 56 as there are another 25 verses in Genesis 2.
11) hebrew_book_index: The number of the book if the Old Testament/Hebrew Bible is ordered according to the traditional Jewish Tanakh ordering, e.g. Genesis is still 1, but Psalms is 27 instead of 19 and 2 Chronicles is 39 instead of Malachi.
12) hebrew_chapter_index: Same as chapter_index but for the Hebrew ordering. Interestingly the median chapter in the whole Bible is then Psalm 28, whilst in just the Hebrew Bible by itself it is Ezekiel 13.
13) hebrew_verse_index: The number of the FINAL verse in that chapter since the start of the Bible, but in the Tanakh ordering.

### Errata
I found a bunch of errors with my code that processed the verse lengths (due to footnotes with verse numbers confusing the count). I've now corrected this and the total number of verses is now 31,102, matching Google's answer for "how many verses are in the Bible". The affected chapters were: 

Genesis 11, Exodus 19, Numbers 21, Judges 16, 1 Samuel 11, 2 Samuel 6, 1 Chronicles 6, 1 Chronicles 16, Ezra 10, Job 35, Proverbs 25, Isaiah 6, Isaiah 23, Isaiah 53, Isaiah 63, Jeremiah 17, Ezekiel 40, Ezekiel 47, Joel 2, Zechariah 2, Zechariah 10, Zechariah 14, Malachi 2, Mark 11, John 5, John 7, John 9, Acts 15, Acts 24, Romans 8, 1 Corinthians 7, 1 Corinthians 8, 1 Corinthians 11, 1 Corinthians 14, Galatians 3, Ephesians 1, Hebrews 2, Hebrews 6, 1 Peter 3 and 1 John 5

Also note that the Textus Receptus of 3 John has 14 verses, whilst the SBL critical edition has 15 (as the 14th verse is split in half). To match other sources online, I stick with 14.
