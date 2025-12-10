FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copier le pom.xml et télécharger les dépendances
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copier le code source
COPY src ./src

# Compiler l'application
RUN mvn clean package -DskipTests

# Image finale
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copier le JAR depuis l'étape de build
COPY --from=build /app/target/*.jar app.jar

# Exposer le port
EXPOSE 8084

# Lancer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
