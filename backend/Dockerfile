# Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache netcat-openbsd
COPY --from=builder /app/target/*.jar app.jar
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
# Carpeta de subidas: no usar COPY (puede no existir en el repo). En compose se monta volumen; sin volumen, el dir vacío basta.
RUN mkdir -p uploads
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
