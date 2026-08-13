/**
 * IDs do TMDB de séries temporariamente ocultas do catálogo.
 *
 * Adicione ou remova IDs desta lista para controlar sua exibição sem alterar
 * os registros armazenados no MongoDB.
 */
export const hiddenSeriesTmdbIds = new Set<number>([
  194766, //verão q mudou a vida dela
  74577, //end of the fucking world
  126308, // xogum
  118906, // universos paralelos
  4604, // smallville
  109939, //nossa bandeira é a morte
  153784, //ta tudo certo
  89901, //dickinson
  100757, //outerbanks
]);
