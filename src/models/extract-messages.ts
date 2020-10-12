export interface IExtractMessage {
	fileName: string
	packId: number
}

export interface IUploadMessage {
	files: {
		mp3: string
		waveformJson: string
		wav: string
	}
	packId: number
}
