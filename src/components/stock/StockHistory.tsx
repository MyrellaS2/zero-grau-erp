import type { StockMovement } from "../../types/product"


interface StockHistoryProps {

  movements: StockMovement[]

}



function StockHistory({
  movements
}: StockHistoryProps) {


  return (

    <div className="bg-white rounded-xl shadow p-6 mt-8">


      <h2 className="text-xl font-bold mb-4">

        Histórico de estoque

      </h2>



      {movements.length === 0 ? (

        <p className="text-gray-500">

          Nenhuma movimentação registrada.

        </p>


      ) : (


        <div className="space-y-4">


          {movements
            .slice()
            .reverse()
            .map((item)=>(


            <div

              key={item.id}

              className="border rounded-lg p-4"

            >


              <div className="flex justify-between">


                <div>


                  <h3 className="font-bold">

                    {item.productName}

                  </h3>


                  <p className="text-sm text-gray-500">

                    {item.date}

                  </p>


                </div>



                <span className="text-green-700 font-bold">

                  +{item.quantity}

                </span>


              </div>




              <p className="mt-2 text-sm">

                Estoque:

                {" "}

                {item.previousStock}

                {" → "}

                {item.currentStock}

              </p>



              <p className="text-sm text-gray-500">

                {item.observation}

              </p>


            </div>


          ))}


        </div>


      )}


    </div>

  )

}


export default StockHistory