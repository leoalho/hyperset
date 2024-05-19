import { Database } from "sqlite";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import sqlite3 from "sqlite3";

export type Card = [number, number, number, number];

export type Deck = Card[];

export interface BoardEntry {
  shape: Card;
}

export interface User {
  //TODO camelcase
  id: string;
  name: string;
  color: string;
  corx: number;
  cory: number;
  gamepoints: number;
  totalpoints: number;
  hints: number;
  created: Date;
  roomNumber: number;
}

interface SocketData {
  roomNumber: number;
  room: string;
  userName: string;
  color: string;
}

export type Io = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

export type Db = Database<sqlite3.Database, sqlite3.Statement>;
