from gpt4all import GPT4All

# Use the smallest model you have (update the filename if needed)
MODEL_PATH = "ggml-gpt4all-j-v1.3-groovy.bin"

if __name__ == "__main__":
    print("Loading GPT4All model...")
    model = GPT4All(MODEL_PATH)
    print("Model loaded. Sending test prompt...")
    prompt = "hi"
    response = model.generate(prompt, max_tokens=64, temp=0.7)
    print(f"Prompt: {prompt}\nResponse: {response}")
