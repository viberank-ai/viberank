# Environment Variables

## CHATGPT_COOKIE

`CHATGPT_COOKIE=__Secure-next-auth.session-token value from your ChatGPT session`

This is required for the ChatGPT Browse scraper to authenticate with OpenAI's ChatGPT service. 

To obtain this value:
1. Log into ChatGPT in your browser
2. Open browser developer tools (F12)
3. Go to Application/Storage > Cookies > https://chat.openai.com
4. Find the `__Secure-next-auth.session-token` cookie and copy its value

**Warning**: This scraper may violate ChatGPT's Terms of Service. Use responsibly and be aware of rate limits.