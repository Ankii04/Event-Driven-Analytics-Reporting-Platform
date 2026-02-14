@echo off
echo Installing dependencies for all services...

echo.
echo Installing API Gateway...
cd services\api-gateway
call npm install
cd ..\..

echo.
echo Installing Event Ingestion...
cd services\event-ingestion
call npm install
cd ..\..

echo.
echo Installing Analytics Worker...
cd services\analytics-worker
call npm install
cd ..\..

echo.
echo Installing Query Service...
cd services\query-service
call npm install
cd ..\..

echo.
echo All dependencies installed!
pause
