import Foundation
import Speech
import AVFoundation

func voiceEvent(_ event:[String:Any]) {
    if let data=try? JSONSerialization.data(withJSONObject:event),let line=String(data:data,encoding:.utf8) { print(line);fflush(stdout) }
}
// Audio callbacks and the main actor share the active request through this gate.
final class VoiceAudioGate: @unchecked Sendable {
    private let lock=NSLock()
    private var request:SFSpeechAudioBufferRecognitionRequest?
    private var muted=false
    func setRequest(_ value:SFSpeechAudioBufferRecognitionRequest?) { lock.lock();request=value;lock.unlock() }
    func setMuted(_ value:Bool) { lock.lock();muted=value;lock.unlock() }
    func append(_ audio:AVAudioPCMBuffer) { lock.lock();defer{lock.unlock()};if !muted {request?.append(audio)} }
}
@MainActor final class VoiceListener {
    let wakeName:String
    let engine=AVAudioEngine()
    let gate=VoiceAudioGate()
    let recognizer=SFSpeechRecognizer(locale:Locale(identifier:"en-US"))
    var task:SFSpeechRecognitionTask?
    var silence:Timer?
    var rotation:Timer?
    var meter:Timer?
    var generation=0
    var latest=""
    var running=false
    var muted=false
    var failures=0
    var level:Float=0
    var controlBuffer=""
    init(wakeName:String) {self.wakeName=wakeName}
    func start() async {
        guard await AVCaptureDevice.requestAccess(for:.audio) else {voiceEvent(["type":"error","text":"Enable DRER in Privacy & Security → Microphone."]);exit(1)}
        let authorization=await withCheckedContinuation { continuation in SFSpeechRecognizer.requestAuthorization { continuation.resume(returning:$0) } }
        guard authorization == .authorized else {voiceEvent(["type":"error","text":"Enable DRER in Privacy & Security → Speech Recognition."]);exit(1)}
        guard let recognizer,recognizer.isAvailable,recognizer.supportsOnDeviceRecognition else {voiceEvent(["type":"error","text":"On-device English recognition is unavailable. Enable English Dictation and download its speech assets in macOS Settings."]);exit(1)}
        let input=engine.inputNode
        let format=input.outputFormat(forBus:0)
        guard format.sampleRate>0,format.channelCount>0 else {voiceEvent(["type":"error","text":"No working microphone was found."]);exit(1)}
        let gate=self.gate
        input.installTap(onBus:0,bufferSize:512,format:format) { audio,_ in
            gate.append(audio)
            if let samples=audio.floatChannelData?[0],audio.frameLength>0 {
                var sum:Float=0
                for i in 0..<Int(audio.frameLength) {sum += samples[i]*samples[i]}
                let rms=sqrt(sum/Float(audio.frameLength))
                Task { @MainActor in self.level=rms }
            }
        }
        engine.prepare()
        do {try engine.start()} catch {voiceEvent(["type":"error","text":error.localizedDescription]);exit(1)}
        running=true
        meter=Timer.scheduledTimer(withTimeInterval:0.25,repeats:true) { _ in Task { @MainActor in voiceEvent(["type":"level","level":min(1,self.level*6)]) } }
        FileHandle.standardInput.readabilityHandler={ handle in
            let data=handle.availableData
            guard !data.isEmpty else {exit(0)}
            if let text=String(data:data,encoding:.utf8) {Task { @MainActor in self.control(text) }}
        }
        listen()
    }
    func control(_ text:String) {
        controlBuffer += text
        while let newline=controlBuffer.firstIndex(of:"\n") {
            let line=String(controlBuffer[..<newline]);controlBuffer.removeSubrange(...newline)
            guard let data=line.data(using:.utf8),let command=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any],let value=command["muted"] as? Bool else {continue}
            muted=value;gate.setMuted(value)
            if value {silence?.invalidate();latest=""} else {listen()}
        }
    }
    func listen() {
        guard running else {return}
        generation += 1
        let token=generation
        silence?.invalidate();rotation?.invalidate();gate.setRequest(nil);task?.cancel()
        latest=""
        let request=SFSpeechAudioBufferRecognitionRequest()
        request.contextualStrings=[wakeName,"Hey "+wakeName,wakeName+" open",wakeName+" please"]
        request.taskHint = .dictation
        request.requiresOnDeviceRecognition=true
        request.shouldReportPartialResults=true
        gate.setRequest(request)
        voiceEvent(["type":"listening","onDevice":true])
        task=recognizer!.recognitionTask(with:request) { result,error in
            Task { @MainActor in
                guard self.generation==token,!self.muted else {return}
                if let result {
                    let text=result.bestTranscription.formattedString
                    if text != self.latest {
                        self.latest=text;self.failures=0
                        voiceEvent(["type":"partial","text":text])
                        self.silence?.invalidate()
                        self.silence=Timer.scheduledTimer(withTimeInterval:0.6,repeats:false) { _ in Task { @MainActor in self.finish(token) } }
                    }
                    if result.isFinal {self.finish(token)}
                } else if let error {
                    self.failures += 1
                    if self.failures>=3 {voiceEvent(["type":"error","text":"Speech recognition stopped: "+error.localizedDescription]);exit(1)}
                    self.generation += 1
                    DispatchQueue.main.asyncAfter(deadline:.now()+0.3) {self.listen()}
                }
            }
        }
        rotation=Timer.scheduledTimer(withTimeInterval:50,repeats:false) { _ in Task { @MainActor in self.finish(token) } }
    }
    func finish(_ token:Int) {
        guard generation==token,!muted else {return}
        generation += 1;silence?.invalidate();rotation?.invalidate()
        let text=latest.trimmingCharacters(in:.whitespacesAndNewlines)
        if !text.isEmpty {voiceEvent(["type":"utterance","text":text])}
        listen()
    }
}
