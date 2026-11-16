import Foundation
import Vision

// Read the fresh simulator screenshot locally. No image leaves the CI runner.
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["en-US"]
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1]))
do {
    try handler.perform([request])
} catch {
    fputs("Screen recognition failed: \(error as NSError)\n", stderr)
    exit(1)
}
let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
let data = try JSONSerialization.data(withJSONObject: text)
print(String(decoding: data, as: UTF8.self))
