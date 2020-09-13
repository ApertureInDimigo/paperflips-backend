-- DB 생성
CREATE DATABASE IF NOT EXISTS paperflips;

USE paperflips;

-- Community_Board(일반 게시판 기능)
CREATE TABLE IF NOT EXISTS Community_Board (
  seq INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(20) NOT NULL,
  name VARCHAR(30) NOT NULL,
  date VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  edited TINYINT(1) NOT NULL,
  deleted TINYINT(1) NOT NULL
);

-- Recipe_Board(레시피 게시판 기능)
CREATE TABLE IF NOT EXISTS Recipe_Board (
  seq INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id VARCHAR(20) NOT NULL,
  name VARCHAR(30) NOT NULL,
  date VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  import VARCHAR(1000) NOT NULL,
  certified TINYINT(1) NOT NULL,
  edited TINYINT(1) NOT NULL,
  shared TINYINT(1) NOT NULL
);

-- Recipe_Step_Info(레시피 단계 정보)
CREATE TABLE IF NOT EXISTS Recipe_Step_Info (
  seq INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  info VARCHAR(1000)
);

-- Users(유저 정보) TABLE
CREATE TABLE IF NOT EXISTS Users (
  id VARCHAR(20) NOT NULL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  password VARCHAR(200) NOT NULL,
  intro VARCHAR(300),
  favorite VARCHAR(500),
  deleted_day VARCHAR(30)
  salt VARCHAR()
);


CREATE TABLE IF NOT EXISTS Recipe (
   seq INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
   recipeName VARCHAR(10),
   rarity VARCHAR(8), 
   summary VARCHAR(30),
   detail VARCHAR(800)
);


-- Logs(로그 정보) TABLE
CREATE TABLE IF NOT EXISTS Logs (
  seq INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  content VARCHAR(1000) NOT NULL,
  date VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS Collection (
   id VARCHAR(20) NOT NULL,
   rec_num INT(11) NOT NULL

);


CREATE TABLE RoomInfo(
   seq INT(11) NOT NULL auto_increment primary key,
   title varchar(20) NOT NULL,
   id varchar(20) NOT NULL,
   `date` datetime NOT NULL,
   `Data` varchar(800) NOT NULL
);

CREATE TABLE Recipe_Detail(
   recipeName varchar(10) NOT NULL primary key,
   detail varchar(800),
   VidPath varchar(50),
   ImgPath varchar(50)
);	