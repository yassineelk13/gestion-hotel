# Étape 1 : Utiliser une image Maven pour compiler le projet
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Utiliser une image Java légère pour exécuter l'application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/reservation-service-1.0.0.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
