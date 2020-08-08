import knex from "../database/connection";
import { Request, Response } from "express";

export default class PointsController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;
    console.log(`Query: ${city}, ${uf}, ${items}`)
    const parsedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

      const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

      return response.json(points);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex("points").where("id", id).first();
    if (!point) {
      return response.status(400).json({ message: "Point not found" });
    }

    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.id")
      .where("point_items.point_id", id)
      .select("items.title");

    return response.json({ point, items });
  }

  async create(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = request.body;

    const trx = await knex.transaction();

    const point = {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
    };

    const data = await trx("points").insert(point);
    const point_id = data[0];

    const pointItems = items.map((item: number) => {
      return { item_id: item, point_id };
    });

    await trx("point_items").insert(pointItems);

    //TODO: verificar se não salva quando tentar criar relação inválida (esta salvando, verificar depois)
    await trx.commit();

    return response.json({ id: point_id, ...point });
  }
}
