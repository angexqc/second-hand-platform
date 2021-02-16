// 购买的商品
const { Utils, Tips, functions } = require('../../utils');
const db = require('../../db');

const table = `buy_shop`; // 映射map

module.exports = {
  // 购买商品
  async paymentShop(ctx) {
    const data = Utils.filter(ctx, ['uid', 'shopList']);
    const valid = Utils.formatData(data, {
      uid: 'number',
      shopList: 'array'
    });
    if (!valid) return ctx.body = Tips[400];

    try {
      const { uid, shopList } = data;
      for (let i = 0; i < shopList.length; i++) {
        const item = shopList[i];
        const { sid, shop_count, state } = item || {};
        let addSql = `INSERT INTO ${table}(uid, sid,shop_count, state, create_time, update_time) VALUES(?,?,?,?,?,?)`;

        await db.query(addSql, [uid, sid, shop_count, state, Date.now(), Date.now()]);
        // 删除购物车里商品
        const deteleSql = `DELETE FROM shop_cart WHERE uid=? and sid=? `;
        await db.query(deteleSql, [uid, sid]);

        // 改变商品为被购买状态
        const shops = await db.query(`SELECT count FROM shop_list WHERE id=${sid}`);
        const { count: num } = shops[0];
        if (num == shop_count) {
          await db.query(`UPDATE shop_list SET display=2 WHERE id = ?`, [sid]);
        } else {
          const count_shop = num - shop_count;
          await db.query(`UPDATE shop_list SET count=? WHERE id = ?`, [count_shop, sid]);
        }
      }

      ctx.body = {
        ...Tips[1001],
        data: 'payment shop in success'
      }
    } catch (error) {
      ctx.body = Tips[1002]
    }
  },
  // 获取购买的商品列表
  async getbuyShopList(ctx) {
    const data = Utils.filter(ctx, ['uid']);
    const valid = Utils.formatData(data, {
      uid: 'number'
    });
    if (!valid) return ctx.body = Tips[400];

    try {
      let findSql = `SELECT * FROM ${table} WHERE uid=? and state=1`;
      const { uid } = data;
      const shopLists = await db.query(findSql, [uid]);
      let list = [];
      if (shopLists.length) {
        for (let i = 0; i < shopLists.length; i++) {
          const { sid, state, create_time, shop_count } = shopLists[i];

          // 查找相应商品
          const shops = await db.query(`SELECT title,price,image,level,information,count FROM shop_list WHERE id=?`, [sid]);
          const { title, price, image, level, information, count } = shops[0];
          list.push({
            title, price, image, level, information, count, state, create_time, shop_count
          })
        }
      }
      ctx.body = {
        ...Tips[1001],
        data: {
          list
        }
      }
    } catch (e) {
      ctx.body = Tips[1002]
    }
  }
}