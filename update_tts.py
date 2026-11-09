import re

with open("src/pages/LessonPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_tts = """  const startTTS = (text: string) => {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = prefs.speechRate

    const langMap: Record<string, string> = {
      en: "en-US",
      ru: "ru-RU",
      uz: "uz-UZ",
      ko: "ko-KR",
      zh: "zh-CN",
    }
    utter.lang = langMap[language] || "uz-UZ"

    // Intelligent voice selection
    const voices = window.speechSynthesis.getVoices()
    let voice = voices.find((v) => v.lang.startsWith(utter.lang.split("-")[0]))

    // Fallback for Uzbek: If no Uzbek voice is available, use Turkish (tr-TR).
    // Turkish phonetic rules for Latin script are similar enough to make Uzbek highly intelligible.
    if (!voice && language === "uz") {
      voice = voices.find((v) => v.lang.startsWith("tr"))
    }

    if (voice) {
      utter.voice = voice
    }

    utter.onend = () => setTtsPlaying(false)
    utter.onerror = () => setTtsPlaying(false)
    ttsRef.current = utter
    window.speechSynthesis.speak(utter)
    setTtsPlaying(true)
  }"""

content = re.sub(r'  const startTTS = \(text: string\) => \{[\s\S]*?setTtsPlaying\(true\)\n  \}', new_tts, content)

with open("src/pages/LessonPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated TTS logic")
