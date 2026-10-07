FROM python:3.11-slim
WORKDIR /app
COPY gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY gateway /app/gateway
COPY public/voice-contract.json /app/voice-contract.json
RUN useradd --uid 10001 --create-home desk && mkdir /data && chown desk:desk /data
USER desk
ENV GATEWAY_STATE_PATH=/data/gateway.sqlite
EXPOSE 8080
CMD ["uvicorn","gateway.main:app","--host","0.0.0.0","--port","8080","--workers","1"]
