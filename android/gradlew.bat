@rem Gradle wrapper script for Windows
@if "%DEBUG%"=="" @echo off
setlocal

set DIRNAME=%~dp0
set WRAPPER_JAR=%DIRNAME%gradle\wrapper\gradle-wrapper.jar

if not exist "%WRAPPER_JAR%" (
    echo Gradle wrapper JAR not found. Please run setup first.
    exit /b 1
)

set JAVA_EXE=java.exe
if defined JAVA_HOME set JAVA_EXE=%JAVA_HOME%\bin\java.exe

"%JAVA_EXE%" %JAVA_OPTS% -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*
