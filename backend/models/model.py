import os
from utils.helper_functions import num_tokens_from_string
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

class OpenAIModel:
    def __init__(self, system_prompt, temperature):
        self.temperature = temperature
        self.system_prompt = system_prompt
        
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.model = os.getenv("OPENAI_MODEL")
            
    def generate_text(self, prompt):
        try:
            input_tokens_length = num_tokens_from_string(self.system_prompt + prompt)
            print("input tokens length", input_tokens_length)
            
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=10000,
                model=self.model, 
                response_format={ "type": "json_object" }
            )
            
            response = chat_completion.choices[0].message.content
            output_tokens_length = num_tokens_from_string(response)
            print("output tokens length", output_tokens_length)
            return response, input_tokens_length, output_tokens_length
        
        except Exception as e:
            response = {"error": f"Error in invoking model! {str(e)}"}
            print(response)
            return response
        
    def generate_string_text(self, prompt):
        try:
            input_tokens_length = num_tokens_from_string(self.system_prompt + prompt)
            print("input tokens length", input_tokens_length)
            
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                model=self.model, 
                max_tokens=10000,
            )
            
            response = chat_completion.choices[0].message.content
            output_tokens_length = num_tokens_from_string(response)
            print("output tokens length", output_tokens_length)
            return response, input_tokens_length, output_tokens_length
        
        except Exception as e:
            response = {"error": f"Error in invoking model! {str(e)}"}
            print(response)
            return response
        
    def generate_with_web_annotations(self, prompt, search_model="gpt-4o-mini-search-preview"):
        try:
            input_tokens_length = num_tokens_from_string(prompt)
            print("input tokens length", input_tokens_length)
            
            chat_completion = self.client.chat.completions.create(
                model=search_model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                # Optionally enable search options 
                # web_search_options={
                #     "search_context_size": "low",
                # },
            )
            
            content = chat_completion.choices[0].message.content
            annotations = chat_completion.choices[0].message.annotations
            output_tokens_length = num_tokens_from_string(content)
            print("output tokens length", output_tokens_length)
            
            return content, annotations, input_tokens_length, output_tokens_length

        except Exception as e:
            print(f"Error in generate_with_web_annotations: {str(e)}")
            return {"error": str(e)}