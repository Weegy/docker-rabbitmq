## Encoding module
Example of encoding message JSON:
```json
{
	"fileName" : "extract/11/Summer Disco House Vol 1 - ACID WAV/Kit_20_Am_124/PLSDH_20_Bass_Am_124.wav",
	"packId" : 11
}
```

Example of upload message JSON:
```json
{
	"mp3Filename" : "./extract/11/Summer Disco House Vol 1 - ACID WAV/Kit_20_Am_124/PLSDH_20_Bass_Am_124.mp3",
	"waveformFilename" : "./extract/11/Summer Disco House Vol 1 - ACID WAV/Kit_20_Am_124/PLSDH_20_Bass_Am_124.json",
	"wavFilename" : "./extract/11/Summer Disco House Vol 1 - ACID WAV/Kit_20_Am_124/PLSDH_20_Bass_Am_124.wav",
	"packId" : 11
}
```

Encoding WAV to MP3 requires <em>lame</em>. To extract Waveform Data from MP3
used <em>[audiowaveform](https://github.com/bbc/audiowaveform)</em>.
