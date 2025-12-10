# Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS build

WORKDIR /app

# Copier pom.xml et télécharger les dépendances (mise en cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copier le code source
COPY src ./src

# Build l'application
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copier le JAR depuis le build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
