import Foundation
import Speech
import AVFoundation

func voiceEvent(_ event: [String:Any]) {
    if let data=try? JSONSerialization.data(withJSONObject:event),let line=String(data:data,encoding:.utf8) { print(line);fflush(stdout) }
}
@MainActor final class VoiceListener {
    let engine=AVAudioEngine()
    let recognizer=SFSpeechRecognizer(locale:Locale(identifier:"en-US"))
    var request:SFSpeechAudioBufferRecognitionRequest?
    var task:SFSpeechRecognitionTask?
    var silence:Timer?
    var rotation:Timer?
    var generation=0
    var latest=""
    var running=false
    var hasTap=false
    func start() async {
        let allowed=await AVCaptureDevice.requestAccess(for:.audio)
        guard allowed else { voiceEvent(["type":"error","text":"Microphone access was denied. Enable DRER in Privacy & Security → Microphone."]);exit(1) }
        let authorization=await withCheckedContinuation { continuation in SFSpeechRecognizer.requestAuthorization { continuation.resume(returning:$0) } }
        guard authorization == .authorized else { voiceEvent(["type":"error","text":"Speech Recognition permission was denied. Enable DRER in Privacy & Security → Speech Recognition."]);exit(1) }
        guard let recognizer,recognizer.isAvailable,recognizer.supportsOnDeviceRecognition else { voiceEvent(["type":"error","text":"On-device English speech recognition is unavailable. Enable English Dictation and download its speech assets in macOS Settings, then try again."]);exit(1) }
        running=true
        listen()
    }
    func listen() {
        guard running else { return }
        generation += 1
        let token=generation
        silence?.invalidate();rotation?.invalidate();task?.cancel();engine.stop();if hasTap {engine.inputNode.removeTap(onBus:0);hasTap=false}
        latest=""
        let input=engine.inputNode
        let format=input.outputFormat(forBus:0)
        guard format.sampleRate>0,format.channelCount>0 else { voiceEvent(["type":"error","text":"No working microphone was found."]);exit(1) }
        let buffer=SFSpeechAudioBufferRecognitionRequest()
        buffer.requiresOnDeviceRecognition=true
        buffer.shouldReportPartialResults=true
        request=buffer
        input.installTap(onBus:0,bufferSize:1024,format:format) { audio,_ in buffer.append(audio) }
        hasTap=true
        engine.prepare()
        do { try engine.start() } catch { voiceEvent(["type":"error","text":error.localizedDescription]);exit(1) }
        voiceEvent(["type":"listening","onDevice":true])
        task=recognizer!.recognitionTask(with:buffer) { result,error in
            Task { @MainActor in
                guard self.generation==token else { return }
                if let result {
                    let text=result.bestTranscription.formattedString
                    if text != self.latest {
                        self.latest=text
                        self.silence?.invalidate()
                        self.silence=Timer.scheduledTimer(withTimeInterval:1.3,repeats:false) { _ in
                            Task { @MainActor in self.finish(token) }
                        }
                    }
                    if result.isFinal { self.finish(token) }
                } else if error != nil {
                    self.generation += 1
                    DispatchQueue.main.asyncAfter(deadline:.now()+0.8) { self.listen() }
                }
            }
        }
        rotation=Timer.scheduledTimer(withTimeInterval:50,repeats:false) { _ in Task { @MainActor in self.finish(token) } }
    }
    func finish(_ token:Int) {
        guard generation==token else { return }
        generation += 1
        silence?.invalidate();rotation?.invalidate()
        let text=latest.trimmingCharacters(in:.whitespacesAndNewlines)
        if !text.isEmpty { voiceEvent(["type":"utterance","text":text]) }
        listen()
    }
}
