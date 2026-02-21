from gpt4all import GPT4All

model = GPT4All("orca-mini-3b-gguf2-q4_0.gguf")

with model.chat_session():
    print(model.generate("Hello, just testing GPT4All"))
